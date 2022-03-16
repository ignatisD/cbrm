import * as IORedis from "ioredis";
import { reduce, cloneDeep } from "lodash";
import * as uuid from "uuid";
import { Application } from "express";
import { IRedisOptions } from "../interfaces/helpers/Redis";
import { IConnector } from "../interfaces/helpers/Connector";
import { Logger } from "./Logger";

/**
 * A helper class proxying a subset of the available commands of the Redis database
 */
export class Redis implements IConnector {


    /**
     * A static property storing the current active Redis class instance for use by the application.
     */
    protected static _instance: Redis;
    /**
     * The IORedis client responsible for conveying the commands to the Redis database.
     */
    protected readonly _client: IORedis.Redis;
    /**
     * This is the prefix used to seperate the data onto different places of the Redis database.
     */
    protected readonly _prefix: string;
    /**
     * Max age ttl (time to live) for saving stuff on the Redis database if none was specified.
     * Currently this matches the refreshToken's duration = 3 days
     */
    public readonly maxAge: number = 259200; // 3 Days == refreshToken duration

    constructor(options?: IRedisOptions) {
        const redisOptions = cloneDeep(options || {});
        redisOptions.host = redisOptions.host || "localhost";
        redisOptions.port = redisOptions.port || 6379;
        redisOptions.prefix = (redisOptions.prefix || "global").toString().toLowerCase();
        if (redisOptions.prefix.substring(redisOptions.prefix.length - 1) !== ":") {
            redisOptions.prefix += ":";
        }
        this._prefix = redisOptions.prefix;
        this._client = new IORedis(redisOptions);
        this._client.on("error" , (err) => {
            Logger.error("RedisError: " + err);
        });
    }

    public async init() {
        return this._client.connect();
    }

    /**
     * Getter accessing the protected _client that was started on construction of the Redis class instance
     */
    public get client(): IORedis.Redis {
        return this._client;
    }

    /**
     * Getter accessing the protected _prefix that was assigned on construction of the Redis class instance
     */
    public get prefix(): string {
        return this._prefix;
    }

    /**
     * Public method for retrieving the current active instance of the Redis class
     */
    public static instance(options?: IRedisOptions): Redis {
        if (!Redis._instance) {
            Redis._instance = new Redis({...(options || {}), prefix: "global"});
        }
        return Redis._instance;
    }

    /**
     * Helper method to safely stringify data for storing on the Redis database
     * @param data
     */
    public static stringify(data: any): string {
        let actual: {data: any} = {
            data: reduce(data, function(memo, val, key) {
                if (typeof val !== "function" && key !== "password")
                    memo[key] = val;
                return memo;
            }, {})
        };
        return JSON.stringify(actual);
    }

    public static parse(str: string): any {
        try {
            const results = JSON.parse(str);
            return results?.data;
        } catch (e) {
            return null;
        }
    }

    /**
     * Returns a uuid (v4) unique code
     */
    public static uniqueId(): string {
        return uuid.v4();
    }

    /**
     * Retrieves keys matching the given pattern from the database.
     * @param {string} pattern
     */
    public async keys(pattern: string): Promise<string[]> {
        try {
            const keys = await this._client.keys(this._prefix + pattern);
            return keys.map(key => key.replace(this._prefix, ""));
        } catch (e) {
            Logger.exception(e);
            return [];
        }
    }

    /**
     * Saves the provided data under the provided key (uuid) in the database
     * @param {string} key
     * @param data
     * @param {number} maxAge
     */
    public async set(key: string, data: any, maxAge?: number): Promise<any> {
        if (maxAge === -1) {
            return this._client.set(this._prefix + key, Redis.stringify(data));
        }
        return this._client.setex(this._prefix + key, maxAge || this.maxAge, Redis.stringify(data));
    }

    /**
     * Retrieves and parses the given key's value from the database.
     * @param {string} key
     */
    public async get(key: string) {
        const response = await this._client.get(this._prefix + key);
        return Redis.parse(response);
    }

    /**
     * Saves the provided integer under the provided key in the database.
     * This key can be safely incremented/decremented.
     * @param key
     * @param num
     * @param maxAge
     */
    public async setInt(key: string, num: number, maxAge?: number): Promise<any> {
        if (maxAge === -1) {
            return this._client.set(this._prefix + key, num);
        }
        return this._client.setex(this._prefix + key, maxAge, num);
    }

    /**
     * Retrieves the specified integer value
     * @param key
     */
    public async getInt(key: string): Promise<number> {
        const number = await this._client.get(this._prefix + key);
        return typeof number === "string" ? parseInt(number) : null;
    }

    /**
     * Increments a given key and returns its value. If it is not defined it is created and returned as 1.
     * @param {string}key
     */
    public async incr(key: string): Promise<number> {
        return await this._client.incr(this._prefix + key);
    }

    /**
     * Increments a given key by the provided number and returns its value. If it is not defined it is created and returned as the number provided.
     * @param {string}key
     * @param num
     */
    public async incrBy(key: string, num: number = 1): Promise<number> {
        return await this._client.send_command("INCRBY", this._prefix + key, num);
    }

    /**
     * Decrements a given key and returns its value. If it is not defined it is created and returned as -1.
     * @param {string} key
     */
    public async decr(key: string): Promise<number> {
        return await this._client.decr(this._prefix + key);
    }

    /**
     * -2: means the key does not exist
     * -1: the key exists but doesn't have an expiration
     * @param {string} key
     */
    public async ttl(key: string): Promise<number> {
        return await this._client.ttl(this._prefix + key);
    }

    /**
     * Sets the expiration ttl for the given key
     * @param key
     * @param maxAge
     */
    public async expire(key: string, maxAge?: number): Promise<number> {
        maxAge = maxAge || this.maxAge;
        return await this._client.expire(this._prefix + key, maxAge);
    }

    /**
     * Update a key's value without affecting its ttl (time to live)
     * @param {string} key
     * @param data
     * @param maxAge
     */
    public async update(key: string, data: any, maxAge?: number): Promise<any> {
        let ttl: number = maxAge || this.maxAge;
        const result = await this.ttl(key);
        if (result > 0 && !maxAge) {
            ttl = result;
        }
        return await this.set(key, data, ttl);
    }

    /**
     * Update a keys ttl
     * @param {string} key
     * @param {number|undefined} ttl
     */
    public async refresh(key: string, ttl?: number): Promise<boolean> {
        const result = await this._client.expire(this._prefix + key, ttl || this.maxAge);
        return result === 1;
    }

    /**
     * Removes the given key from the database
     * @param {string} key
     */
    public async delete(key: string) {
        return await this._client.del(this._prefix + key);
    }

    /**
     * Push a string to an array
     * @param {string} key
     * @param {string[]} items
     * @param {number|undefined} maxAge
     */
    public async push(key: string, items: string[], maxAge?: number) {
        const result = await this._client.lpush(this._prefix + key, ...items);
        await this.expire(key, maxAge);
        return result;
    }

    /**
     * Retrieve an array of strings
     * @param {string} key
     * @param {number} start
     * @param {number} end
     */
    public async getAll(key: string, start: number = 0, end: number = -1) {
        return await this._client.lrange(this._prefix + key, start, end);
    }

    public async onAppReady(app?: Application): Promise<void> {}

    public async onDisconnect(): Promise<void> {
        this._client.disconnect();
    }
}
