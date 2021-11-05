import { Job } from "bull";
import * as moment from "moment";
import { performance } from "perf_hooks";
import { pick } from "lodash";
import { Request } from "express";
// Interfaces
import IBusinessLike from "@interfaces/business/BusinessLike";
import IRepository from "@interfaces/repository/Repository";
import { Doc } from "@interfaces/models/base/ModelBase";
import INotification from "@interfaces/helpers/Notification";
import IUser from "@interfaces/models/User";
import { IRequestMetadata, ISearchTerms } from "@interfaces/helpers/SearchTerms";
import { NewAble } from "@interfaces/helpers/NewAble";
// Helpers
import JsonResponse from "@helpers/JsonResponse";
import NotificationMailer from "@mailers/NotificationMailer";
import QueuedJob from "@helpers/QueuedJob";
import Sockets from "@config/sockets";
import SearchTerms from "@helpers/SearchTerms";
import { Tube, Tubes } from "@helpers/Tubes";
import Helpers from "@helpers/Helpers";
import IError from "@interfaces/common/Error";

export default abstract class Business<T = any> implements IBusinessLike {

    protected _token: string;
    protected _uniqueId: string;
    protected _debug: any;
    protected _user: Partial<IUser>;
    protected _socket: string;
    protected _locale: string;
    protected _start: number;
    protected _heap: number;
    protected _repo: IRepository;

    public tube: Tube;
    public nextTube: Tube;
    public job: Job;
    public meta: IRequestMetadata;

    protected constructor(repo: IRepository = null) {
        this._repo = repo;
        this.tube = Tubes.NORMAL;
        this.nextTube = Tubes.NORMAL;
    }

    public get modelName() {
        return this._repo?.modelName;
    }

    public get debug() {
        return this._debug;
    }

    public get token() {
        return this._token;
    }

    public get locale() {
        return this._locale;
    }

    public addToken(token: string): this {
        this._token = token;
        return this;
    }

    public get authorization(): string {
        return `Bearer ${this.token}`;
    }

    public get businessUser() {
        return {
            business: this.constructor?.name,
            user: pick(this._user, ["_id", "fullName", "firstName", "lastName", "email"])
        };
    }

    public get uniqueId(): string|null {
        return this._uniqueId || null;
    }

    public set uniqueId(uniqId) {
        this._uniqueId = uniqId || null;
    }

    public exception(e: IError, method?: string, details?: any): void {
        Log.exception(e, {
            business: this.constructor?.name,
            method: method,
            user: pick(this._user, ["_id", "fullName", "firstName", "lastName", "email"]),
            details
        });
    }

    public warning(warning: string, method?: string, details?: any): void {
        Log.warning(warning, {
            business: this.constructor?.name,
            method: method,
            user: pick(this._user, ["_id", "fullName", "firstName", "lastName", "email"]),
            details
        });
    }

    public setTube(tube: Tube = Tubes.NORMAL, nextTube?: Tube): this {
        this.tube = tube;
        this.nextTube = nextTube || tube;
        return this;
    }

    public jobTitle(title: string): string|null {
        if (this.job && this.job.data?.title) {
            this.job.data.title = title;
            this.job.update(this.job.data);
            return title;
        }
        return null;
    }

    protected _enrichWithUser(item: any|any[]) {
        if (this._user && this._user._id) {
            if (Array.isArray(item)) {
                item.map((i) => i.user = this._user._id);
            } else {
                item.user = this._user._id;
            }
        }
        return item;
    }

    public queue(business: any = this) {
        return new QueuedJob(business)
            .addSocket(this._socket)
            .addUser(this._user, this.uniqueId)
            .addToken(this.token)
            .setTube(this.tube);
    }

    /**
     * Helper method to retrieve a {@link JsonResponse} instance
     * @protected
     */
    protected _response<R = Doc<T>>(): JsonResponse<R> {
        return new JsonResponse<R>();
    }

    public fromRequest(req?: Request): this {
        if (req) {
            this.addUser(req.user, req.headers.socket);
            this.setLocale(req.locale);
            this.meta = SearchTerms.requestMeta(req);
        }
        if (req?.headers?.authorization) {
            const token = req.headers.authorization.replace("Bearer ", "");
            if (token) {
                this.addToken(token);
            }
        }
        return this;
    }

    public addUser(user: Partial<IUser> = null, socket?: string|string[]): this {
        this._user = user;
        if (this._repo) {
            this._repo.addUser(user);
        }
        if (socket) {
            this.addSocket(socket);
        }
        return this;
    }

    public addSocket(socket?: string|string[]): this {
        if (socket) {
            this._socket = Array.isArray(socket) ? socket[0] : socket;
        }
        return this;
    }

    public addUniqueId(uniqueId?: string): this {
        if (uniqueId) {
            this._uniqueId = uniqueId;
        }
        return this;
    }

    public addJob(job: Job): this {
        if (job) {
            this.job = job;
            if ("progress" in job) {
                this.progress = job.progress.bind(job);
            }
        }
        return this;
    }

    public addMeta(meta: IRequestMetadata) {
        this.meta = meta;
        return this;
    }

    public setLocale(locale: string) {
        if (locale) {
            this._locale = locale;
        }
        return this;
    }

    public enrichBusiness<B extends IBusinessLike>(business: NewAble<B>, session?: any): B {
        const b: B = new business()
            .addUser(this._user, this._socket)
            .addToken(this.token)
            .addMeta(this.meta)
            .setLocale(this.locale)
            .addUniqueId(this.uniqueId);
        if (session) {
            b.addTransaction(session);
        }
        return b;
    }

    public notifyUser(notification: INotification): this {
        let channel: string = null;
        if (notification.channel) {
            channel = notification.channel;
        } else if (notification.user?._id) {
            channel = notification.user._id;
        } else if (notification.socket) {
            channel = notification.socket;
        } else if (this._user?._id) {
            channel = this._user._id;
        } else if (this._socket) {
            channel = this._socket;
        }
        if (!notification?.type) {
            notification.type = "INFO";
        }
        if (notification.timestamp) {
            notification.took = Date.now() - notification.timestamp;
        }
        notification.timestamp = Date.now();
        if (channel) {
            Sockets.notify(channel, notification);
        }
        if (notification.email) {
            if (!notification.user) {
                notification.user = this._user;
            }
            const mailer = new NotificationMailer();
            mailer.notify(notification);
        }
        return this;
    }

    public performanceStart() {
        this._start = performance.now();
        this._heap = process.memoryUsage().heapUsed / 1024 / 1024;
    }

    public performanceCalc(log: boolean = false) {
        const final = process.memoryUsage().heapUsed / 1024 / 1024;
        const milliseconds = moment.duration(performance.now() - this._start, "ms");
        const elapsed = (Math.round(milliseconds.asSeconds() * 1000) / 1000).toString() + " sec";
        const heap = Math.round((final - this._heap) * 100) / 100;
        const message = `The script used approximately ${heap} MB of memory in ${elapsed}`;
        if (log) {
            Log.debug(message);
        }
        return {
            time: elapsed,
            heap: heap,
            message: message
        };
    }

    /**
     * This method is overwritten when the business is used in Queue and reflects the job.progress method which updates
     * the progress percentage on the Bull UI view ({@link http://127.0.0.1:3000/job-api/})
     * @param percentage
     */
    public progress(percentage: number): any {
        return null;
    }

    public addTransaction(session: any): void {}

    async populate(docs: T, st: ISearchTerms): Promise<T>;
    async populate(docs: T[], st: ISearchTerms): Promise<T[]>;
    async populate(docs: T[]|T, st: ISearchTerms) {
        if (this._token) {
            st.token = this._token;
        }
        return Helpers.populate(docs, st);
    }

}
