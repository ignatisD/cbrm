import { Application } from "express";
import { IConnector } from "../interfaces/helpers/Connector";
import { IStorage } from "../interfaces/helpers/Storage";
import { Helpers } from "./Helpers";

export class Storage<T extends Record<string, any> = Record<string, any>> implements IConnector, IStorage {

    protected _store: Partial<T> = {};

    constructor() {}

    public setup(config?: T) {
        if (config && typeof config === "object") {
            Object.keys(config).forEach((key: keyof T) => {
                this._store[key] = config[key];
            });
        }
        return this;
    }

    public init(config?: T) {
        this.setup(config);
        return Promise.resolve(this);
    }

    public get<K extends keyof T>(key: K, orElse?: T[K]): T[K] {
        return this._store[key] ?? orElse;
    }

    public set<K extends keyof T>(key: K, value: T[K]): this {
        this._store[key] = value;
        return this;
    }

    public push<K extends keyof T>(key: K, values: T[K]): this {
        if (!key) {
            return this;
        }
        if (typeof this._store[key] === "undefined") {
            this._store[key] = <T[K]>[];
        }
        if (this._store[key].push === "undefined") {
            return this;
        }
        this._store[key].push(...Helpers.toArray(values));
        return this;
    }

    public unset<K extends keyof T>(key: K): this {
        delete this._store[key];
        return this;
    }

    public has<K extends keyof T>(key: K): boolean {
        return this._store.hasOwnProperty(key);
    }

    public clear(): this {
        this._store = {};
        return this;
    }

    public async onAppReady(app?: Application): Promise<void> {}

    public async onDisconnect(): Promise<void> {}
}
