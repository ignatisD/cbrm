import { Application } from "express";
import * as IORedis from "ioredis";
import * as Bull from "bull";
import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ExpressAdapter } from "@bull-board/express";
// interfaces
import { IJobData } from "../interfaces/helpers/QueuedJob";
import IBusinessLike from "../interfaces/business/BusinessLike";
// Helpers
import JsonResponse from "./JsonResponse";
import QueuedJob from "./QueuedJob";
import ResponseError from "./ResponseError";
import { Tubes } from "./Tubes";
import Logger from "./Logger";

export default class Queue {

    public static singleton: Queue;
    public static ready: boolean = false;

    public static queues: Record<string, Bull.Queue> = {};
    public static get SOLO(): Bull.Queue {
        return this.queues[this.getTube(Tubes.SOLO)];
    }
    public static get LAZY(): Bull.Queue {
        return this.queues[this.getTube(Tubes.LAZY)];
    }
    public static get NORMAL(): Bull.Queue {
        return this.queues[this.getTube(Tubes.NORMAL)];
    }
    public static get QUICK(): Bull.Queue {
        return this.queues[this.getTube(Tubes.QUICK)];
    }

    protected static readonly _prefix = "queue";
    protected static options: Bull.QueueOptions;

    protected constructor() {
    }

    protected static get prefix() {
        return `${global.prefix}:${this._prefix}`;
    }

    public static getTube(tube: string = Tubes.NORMAL, api: string = global.API) {
        return `${api}_${tube}`;
    }

    public static bootstrap(app?: Application) {
        if (Queue.ready) {
            return;
        }
        const redisOptions: IORedis.RedisOptions = {
            ...global.Redis,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
        };
        Queue.options = {
            prefix: this.prefix,
            redis: redisOptions,
            settings: {
                lockDuration: 50000,
                lockRenewTime: 25000,  // = lockDuration / 2,
                stalledInterval: 50000, // = lockDuration
                maxStalledCount: 2, // The maximum number of times a job can be recovered from the 'stalled' state
            },
            createClient(type: "client" | "subscriber" | "bclient", redisOpts?: IORedis.RedisOptions): IORedis.Redis | IORedis.Cluster {
                switch (type) {
                    case "client":
                    case "subscriber":
                    case "bclient":
                    default:
                        return new IORedis(redisOptions);
                }
            }
        };
        const allTubes: string[] = [Tubes.SOLO, Tubes.LAZY, Tubes.NORMAL, Tubes.QUICK];
        let queueName;
        for (let tube of allTubes) {
            queueName = Queue.getTube(tube);
            Queue.queues[queueName] = new Bull(queueName, Queue.options);
        }
        if (app) {
            const serverAdapter = new ExpressAdapter();
            serverAdapter.setBasePath("/job-api/");
            createBullBoard({
                queues: Object.values(Queue.queues).map(q => {
                    return new BullAdapter(q);
                }),
                serverAdapter,
            });
            app.use("/job-api/", serverAdapter.getRouter());
            Logger.info("Bull board up and running...");
        }
        Queue.ready = true;
        return Queue.singleton;
    }

    public static workersListen() {
        if (!Queue.ready) {
            return;
        }
        if (global.isMainWorker) {
            Queue.SOLO.process(1, Queue.process);
        }
        Queue.LAZY.process(5, Queue.process);
        Queue.NORMAL.process(8, Queue.process);
        Queue.QUICK.process(10, Queue.process);
    }

    public static stopWorkers(isLocal: boolean = true): JsonResponse<string[]> {
        const response = new JsonResponse();
        response.set("isLocal", isLocal);
        Queue.SOLO.pause(isLocal);
        Queue.LAZY.pause(isLocal);
        Queue.NORMAL.pause(isLocal);
        Queue.QUICK.pause(isLocal);
        Logger.warning(`Stopping Workers: ${process.env.HOSTNAME}`);
        return response.ok([
            Queue.SOLO.name,
            Queue.LAZY.name,
            Queue.NORMAL.name,
            Queue.QUICK.name,
        ]);
    }

    public static startWorkers(isLocal: boolean = true): JsonResponse<string[]> {
        const response = new JsonResponse();
        response.set("isLocal", isLocal);
        Queue.SOLO.resume(isLocal);
        Queue.LAZY.resume(isLocal);
        Queue.NORMAL.resume(isLocal);
        Queue.QUICK.resume(isLocal);
        Logger.warning(`Starting ${isLocal ? "local" : "all"} Workers: ${process.env.HOSTNAME}`);
        return response.ok([
            Queue.SOLO.name,
            Queue.LAZY.name,
            Queue.NORMAL.name,
            Queue.QUICK.name,
        ]);
    }

    public static async jobCleaner(queueName: string, state: Bull.JobStatusClean = "completed", limit?: number) {
        const queue: Bull.Queue = new Bull(queueName, Queue.options);
        const jobs = await queue.clean(0, state, limit);
        await queue.close(true);
        return jobs.length;
    }

    public static async retryFailed(queueName: string, limit: number) {
        const queue: Bull.Queue = new Bull(queueName, Queue.options);
        const jobs = await queue.getFailed(0, limit);
        for (let job of jobs) {
            await job.retry();
        }
        await queue.close(true);
        return jobs.length;
    }

    public static async removeJob(queueName: string, jobId: string) {
        const queue: Bull.Queue = new Bull(queueName, Queue.options);
        const job: Bull.Job = await queue.getJob(jobId);
        if (!job) {
            await queue.close(true);
            return false;
        }
        await job.remove();
        await queue.close(true);
        return true;
    }

    public static async create(q: QueuedJob): Promise<Bull.Job> {
        if (!Queue.ready) {
            throw new Error("Queues have not yet been initialized");
        }
        const queueName = Queue.getTube(q.tube, q.api);
        let queue: Bull.Queue = Queue.queues[queueName];
        let close = false;
        if (queue === undefined) {
            queue = new Bull(queueName, Queue.options);
            close = true;
        }
        const job = await queue.add(q.getData(true), q.getOptions());
        if (close) {
            await queue.close(true);
        }
        return job;
    }

    public static async process(job: Bull.Job, done: Bull.DoneCallback) {
        const data: IJobData = job.data || <any>{};
        const method = data.method;
        const businessName = data.business;
        const user = data.user || null;
        try {
            const instance = !!data.instance;
            const inputs = data.inputs || [];
            const socket = data.socket;
            const token = data.token;
            if (!method || !businessName) {
                Logger.error(`MethodAndBusinessRequired: ${method}@${businessName}`);
                done(new ResponseError("MethodAndBusinessRequired", `Business and business method are required for background processes.`), data);
                return;
            }
            const BusinessClass = global.businessRegistry[businessName];
            if (!BusinessClass) {
                Logger.error(`BusinessNotFound: ${businessName}`);
                done(new ResponseError("BusinessNotFound", `Business '${businessName}' was not found`), data);
                return;
            }
            const business: IBusinessLike = instance ? new BusinessClass() : BusinessClass; // static or instance
            if (!business || !(method in business)) {
                Logger.error(`MethodNotFound: ${method} in business: ${businessName}`);
                done(new ResponseError("MethodNotFound", `'${method}' was not found in ${businessName}`), data);
                return;
            }
            business.job = job;
            if (data.businessTube) {
                business.tube = data.businessTube;
            }
            if (data.uniqueId) {
                business.uniqueId = data.uniqueId;
            }
            if (user && business.addUser) {
                business.addUser(user, socket);
            } else if (socket) {
                business.addSocket(socket);
            }
            if (data.token) {
                business.addToken(token);
            }
            business.progress = job.progress.bind(job);
            const result = await business[method](...inputs);
            if (data.uniqueId) {
                await QueuedJob.check(business);
            }
            done(null, result);
        } catch (e) {
            Logger.exception(e, {custom: {business: businessName, method: method, email: user?.email}});
            done(e, data);
        }
    }

    public static shutdown() {
        const promises: Promise<void>[] = [
            Queue.SOLO.close(true),
            Queue.LAZY.close(true),
            Queue.NORMAL.close(true),
            Queue.QUICK.close(true),
        ];
        return Promise.all(promises);
    }

}
