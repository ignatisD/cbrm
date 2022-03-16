import { GlobalConfiguration } from "../interfaces/helpers/GlobalConfiguration";
import { IConnector } from "../interfaces/helpers/Connector";
import { Application } from "express";

export class Configuration<T extends Record<string, any>> implements IConnector {

    protected static _instance: Configuration<Record<string, any>>;
    protected _store: any = {};

    constructor() {}

    public static instance<G extends GlobalConfiguration>(): Configuration<G> {
        if (!this._instance) {
            this._instance = new Configuration<G>();
        }
        return <Configuration<G>>this._instance;
    }

    public static get<G extends GlobalConfiguration, K extends keyof G>(key: K, orElse?: G[K]): G[K] {
        return this.instance<G>().get(key, orElse);
    }
    public static set<G extends GlobalConfiguration, K extends keyof G>(key: K, value?: G[K]): Configuration<G> {
        return this.instance<G>().set(key, value);
    }
    public static has<G extends GlobalConfiguration, K extends keyof G>(key: K): boolean {
        return this.instance<G>().has(key);
    }

    public setup(config?: T) {
        if (config && typeof config === "object") {
            Object.keys(config).forEach(key => {
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
