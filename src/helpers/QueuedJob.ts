import { Job, JobOptions } from "bull";
import { CronJob } from "cron";
import cronstrue from "cronstrue";
import { pick } from "lodash";
import * as moment from "moment";
import { IJobData, IQueuedJob } from "../interfaces/helpers/QueuedJob";
import IUser from "../interfaces/models/User";
import INotification from "../interfaces/helpers/Notification";
import IBusinessLike from "../interfaces/business/BusinessLike";
import Queue from "./Queue";
import { Tubes } from "./Tubes";
import JsonResponse from "./JsonResponse";
import Redis from "./Redis";

export default class QueuedJob implements IQueuedJob {
    public business: string;
    public method: string;
    public inputs: any[] = [];
    // optional
    public instance: boolean = true;
    public title: string;
    // milliseconds
    public delay: number = 0;
    public priority: number = 0;
    public attempts: number = 0;
    public user: Partial<IUser>;
    public socket: string;

    public uniqueId: string;
    public api: string = global.API;
    public tube: string = Tubes.NORMAL;
    public businessTube: string;
    public notification: INotification;

    public removeOnComplete: boolean = true;

    protected _id: string;
    protected _token: string;
    protected _cron: CronJob;
    public onComplete: IQueuedJob;

    private static ttl: number = 259200; // 3 day

    constructor(business: any, method: string = null, inputs: any[] = [], instance = true) {
        const constructor = business.constructor?.name;
        switch (constructor) {
            case "String":
                this.business = business;
                break;
            case "Function":
                const b = new business();
                this.business = b.constructor?.name;
                break;
            default:
                this.business = constructor;
                break;
        }
        this.tube = Tubes.NORMAL;
        if (method) {
            this.setup(method, inputs, instance);
        }
    }

    public get id(): string {
        return this._id;
    }

    public setApi(api?: string) {
        this.api = api || global.API;
        return this;
    }

    public setTube(tube?: string) {
        this.tube = tube || Tubes.NORMAL;
        return this;
    }

    public nextTube(tube?: string) {
        if (tube) {
            this.businessTube = tube;
        }
        return this;
    }

    public get token() {
        return this._token;
    }
    public addToken(token: string): this {
        this._token = token;
        return this;
    }

    public addSocket(socket: string): this {
        this.socket = socket;
        return this;
    }

    public get cron() {
        return this._cron || null;
    }

    public addUser(user: Partial<IUser>, uniqueId?: string) {
        if (user && user._id) {
            this.user = pick(user, ["_id", "fullName", "firstName", "lastName", "email"]);
        }
        this.setUniqueId(uniqueId);
        return this;
    }
    public notify(uniqueId: string = null, notification: INotification = null) {
        if (!uniqueId) {
            uniqueId = Redis.uniqueId();
        }
        this.uniqueId = uniqueId;
        this.notification = notification;
        return this;
    }
    public setUniqueId(uniqueId: string = null) {
        if (uniqueId) {
            this.uniqueId = uniqueId;
        }
        return this;
    }

    public setTitle(title = null) {
        this.title = title;
        return this;
    }
    public getTitle(): string {
        const prefix = this.instance ? "new " : "";
        const suffix = this.instance ? "()" : "";
        return this.title || `Background '${prefix}${this.business}${suffix}.${this.method}' operation`;
    }

    public getData(withInputs: boolean = true) {
        const data: Partial<IJobData> = {
            title: this.getTitle(),
            business: this.business,
            method: this.method,
            instance: !!this.instance,
            user: this.user,
            socket: this.socket,
            uniqueId: this.uniqueId,
            token: this._token,
            businessTube: this.businessTube,
            notification: this.notification
        };
        if (withInputs) {
            data.inputs = this.inputs;
        }
        return data;
    }

    public setup(method: string, inputs: any[] = [], instance = true) {
        this.method = method;
        this.inputs = inputs;
        this.instance = !!instance;
        return this;
    }

    public later(milliseconds: number = 0) {
        this.delay = milliseconds;
        return this;
    }
    public retry(extraTries: number = 0) {
        this.attempts = 1 + extraTries;
        return this;
    }
    public weight(priority: number = 0) {
        this.priority = priority;
        return this;
    }
    public schedule(m: moment.Moment) {
        const now = moment.utc();
        let delay = m.diff(now, "milliseconds");
        if (delay > 0) {
            if (delay > 259200000) {
                delay = 259200000;
            }
            this.later(delay);
        }
        return this;
    }

    public fireOnComplete(job: IQueuedJob): this {
        this.onComplete = job;
        return this;
    }

    public async fire(tube?: string): Promise<JsonResponse<string>> {
        if (tube) {
            this.tube = tube;
        }
        const response = new JsonResponse<string>();
        try {
            response.set("details", this.getData(false));
            // Only check local businesses
            if (this.api === global.API) {
                const BusinessClass = global.businessRegistry[this.business];
                if (!BusinessClass) {
                    return response.error(`Business not registered: ${this.business}`);
                }
                if (this.instance) {
                    const business = new BusinessClass();
                    if (!(this.method in business)) {
                        return response.error(`Method not found in instance: ${this.business}().${this.method}`);
                    }
                } else {
                    if (!(this.method in BusinessClass)) {
                        return response.error(`Static method not found: ${this.business}.${this.method}`);
                    }
                }
            }
            if (this.uniqueId) {
                await QueuedJob.publish(this.uniqueId, this.notification, this.onComplete);
                response.set("uniqueId", this.uniqueId);
            }
            const q: Job = await Queue.create(this);
            response.set("options", this.getOptions());
            if (q.id) {
                this._id = q.id.toString();
                response.set("jobId", this._id);
            }
            return response.ok(`Operation '${this.method}' of business '${this.business}' will be completed in the background`, "message");
        } catch (e) {
            Log.exception(e);
            return response.exception(e);
        }
    }

    public getOptions(): JobOptions {
        const options: JobOptions = {
            removeOnComplete: this.removeOnComplete
        };
        if (this.attempts) {
            options.attempts = this.attempts;
        }
        if (this.priority) {
            options.priority = this.priority;
        }
        if (this.delay) {
            options.delay = this.delay;
        }
        return options;
    }

    public fireCron(cronPattern: string): JsonResponse<string> {
        // CronJob
        this._cron = new CronJob(cronPattern, this.fire, null, true, null, this, false);
        return new JsonResponse().ok(`Operation '${this.method}' of business '${this.business}' will be running in the background '${cronstrue.toString(cronPattern)}'`, "message");
    }



    /** Queue Notifications Helpers */

    /**
     * Get the notification key for the specified type and uniqueId
     * @param uniqueId
     * @param type
     */
    public static getKey(uniqueId: string, type: string) {
        const redisPrefix = "notification";
        return `${redisPrefix}_${uniqueId}_${type}`;
    }

    /**
     * Publish a Queue, incrementing its counter. Also, a notification might be included and triggered on completion.
     * @param uniqueId
     * @param notification
     * @param onComplete
     */
    public static async publish(uniqueId: string, notification?: INotification, onComplete?: IQueuedJob): Promise<number> {
        try {
            if (!uniqueId) {
                return Promise.resolve(-1);
            }
            const instance = Redis.instance();

            const counterKey = this.getKey(uniqueId, "incr");
            const notificationKey = this.getKey(uniqueId, "notification");

            const counter: number = await instance.incr(counterKey);
            // Log.success(`${uniqueId} => ${counter}`);
            const expire = instance.expire(counterKey, this.ttl);
            if (notification && notification.title) {
                const n: INotification|null = await instance.get(notificationKey);
                if (n) {
                    notification = {...n, ...notification};
                } else {
                    notification.timestamp = notification.timestamp || Date.now();
                }
                await instance.set(notificationKey, notification, this.ttl);
            }
            if (onComplete) {
                await this.setOnComplete(uniqueId, onComplete);
            }
            await expire;
            return counter;
        } catch (e) {
            Log.exception(e);
            return -1;
        }
    }

    public static async setOnComplete(uniqueId: string, onComplete: IQueuedJob) {
        if (!uniqueId) {
            return Promise.resolve(false);
        }
        const instance = Redis.instance();
        const onCompleteKey = this.getKey(uniqueId, "job");
        let job: IQueuedJob|null = await instance.get(onCompleteKey);
        if (job) {
            onComplete.onComplete = job;
        }
        return await instance.set(onCompleteKey, onComplete, this.ttl);
    }

    public static async updateWithSum(business: IBusinessLike, num: number, pre: string[], post: string[], body: boolean = true) {
        try {
            const uniqueId = business.uniqueId;
            if (!uniqueId) {
                return Promise.resolve(-1);
            }
            const instance = Redis.instance();

            const counterKey = this.getKey(uniqueId, "incr");
            const notificationKey = this.getKey(uniqueId, "notification");
            const sumKey = this.getKey(uniqueId, "sum");

            const counter: number = await instance.getInt(counterKey);
            if (!counter) {
                return -1;
            }
            const expire = instance.expire(counterKey, this.ttl);
            const notification: INotification|null = await instance.get(notificationKey);
            if (!notification) {
                return counter;
            }
            const sum = await instance.incrBy(sumKey, num);
            const sumExpire = instance.expire(sumKey, this.ttl);

            if (body) {
                notification.body = [...pre, sum, ...post].join("");
            } else {
                notification.title = [...pre, sum, ...post].join("");
            }

            await instance.update(notificationKey, notification, this.ttl);
            await expire;
            await sumExpire;
            return counter;
        } catch (e) {
            business?.exception?.(e);
            return -1;
        }
    }

    public static async updateNotification(business: IBusinessLike, notification: INotification) {
        try {
            const uniqueId = business.uniqueId;
            if (!uniqueId) {
                return Promise.resolve(-1);
            }
            const instance = Redis.instance();

            const counterKey = this.getKey(uniqueId, "incr");

            const counter: number = await instance.getInt(counterKey);
            if (!counter) {
                return -1;
            }
            const notificationKey = this.getKey(uniqueId, "notification");
            const n: INotification = (await instance.get(notificationKey)) || {};
            notification = {...n, ...notification};
            if (!notification.title) {
                notification.title = n?.title || "Greetings Traveler";
            }
            await instance.update(notificationKey, notification, this.ttl);
            return counter;
        } catch (e) {
            business?.exception?.(e);
            return -1;
        }
    }

    public static async addErrors(business: IBusinessLike, errors: string[]) {
        try {
            const uniqueId = business.uniqueId;
            if (!uniqueId || !errors?.length) {
                return Promise.resolve(-1);
            }
            const instance = Redis.instance();

            const counterKey = this.getKey(uniqueId, "incr");

            const counter: number = await instance.getInt(counterKey);
            if (!counter) {
                return -1;
            }
            const errorKey = this.getKey(uniqueId, "errors");
            return await instance.push(errorKey, errors);
        } catch (e) {
            business?.exception?.(e);
            return -1;
        }
    }

    public static async check(business: IBusinessLike): Promise<number> {
        try {
            const uniqueId = business.uniqueId;
            if (!uniqueId) {
                return Promise.resolve(-1);
            }
            const instance = Redis.instance();

            const counterKey = this.getKey(uniqueId, "incr");
            const notificationKey = this.getKey(uniqueId, "notification");
            const summaryKey = this.getKey(uniqueId, "sum");
            const onCompleteKey = this.getKey(uniqueId, "job");
            const errorKey = this.getKey(uniqueId, "errors");

            const counter: number = await instance.decr(counterKey);
            // Log.warning(`${uniqueId} => ${counter}`);
            if (counter !== 0) {
                return counter;
            }
            const job: IQueuedJob|null = await instance.get(onCompleteKey);
            if (job) {
                await instance.delete(onCompleteKey);
                const q = new QueuedJob(job.business)
                    .setup(job.method, job.inputs, job.instance !== false)
                    .setApi(job.api || global.API);
                if (job.delay) {
                    q.later(job.delay);
                }
                if (job.tube) {
                    q.setTube(job.tube);
                    q.nextTube(job.tube);
                }
                if (job.onComplete) {
                    q.fireOnComplete(job.onComplete);
                }
                if (job.notification) {
                    q.notify(job.uniqueId, job.notification);
                }
                q.addUser(job.user, job.uniqueId);
                await q.fire();
                return 1;
            }
            const notification: INotification|null = await instance.get(notificationKey);
            if (notification) {
                const errors = await instance.getAll(errorKey);
                if (errors?.length) {
                    if (!notification.params) {
                        notification.params = {};
                    }
                    notification.params.errorCount = errors.length;
                    notification.params.errors = errors.slice(0, 50);
                }
            }
            const delCounter = instance.delete(counterKey);
            const delNotification = instance.delete(notificationKey);
            const delOnComplete = instance.delete(onCompleteKey);
            const delSummary = instance.delete(summaryKey);
            const delError = instance.delete(errorKey);
            if (notification && notification.title) {
                if (!notification.tag) {
                    notification.tag = uniqueId;
                }
                business.notifyUser(notification);
            }
            await delCounter;
            await delNotification;
            await delOnComplete;
            await delSummary;
            await delError;
            return counter;
        } catch (e) {
            business?.exception?.(e);
            return -1;
        }
    }

}
