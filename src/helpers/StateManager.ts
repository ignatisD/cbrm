import { GlobalState } from "../interfaces/helpers/GlobalState";
import { IConnector } from "../interfaces/helpers/Connector";
import { Application } from "express";

export class StateManager<T extends Record<string, any>> implements IConnector {

    protected static _instance: StateManager<Record<string, any>>;
    protected _store: any = {};

    constructor() {}

    public static instance<G extends GlobalState>(): StateManager<G> {
        if (!this._instance) {
            this._instance = new StateManager<G>();
        }
        return <StateManager<G>>this._instance;
    }

    public static get<G extends GlobalState, K extends keyof G>(key: K, orElse?: G[K]): G[K] {
        return this.instance<G>().get(key, orElse);
    }
    public static set<G extends GlobalState, K extends keyof G>(key: K, value?: G[K]): StateManager<G> {
        return this.instance<G>().set(key, value);
    }
    public static has<G extends GlobalState, K extends keyof G>(key: K): boolean {
        return this.instance<G>().has(key);
    }

    public async init(instance?: T) {
        if (instance && typeof instance === "object") {
            Object.keys(instance).forEach(key => {
                this._store[key] = instance[key];
            });
        }
        return this;
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
