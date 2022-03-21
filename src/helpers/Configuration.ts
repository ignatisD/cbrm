import { GlobalConfiguration } from "../interfaces/helpers/GlobalConfiguration";
import { Storage } from "./Storage";

export class Configuration<T extends GlobalConfiguration = GlobalConfiguration> extends Storage<T> {

    protected static _instance: Configuration;

    public static instance<G extends GlobalConfiguration = GlobalConfiguration>(): Configuration<G> {
        if (!this._instance) {
            this._instance = new Configuration<G>();
        }
        return <Configuration<G>>this._instance;
    }

    public static get<G extends GlobalConfiguration = GlobalConfiguration>(key: keyof G, orElse?: G[keyof G]): G[keyof G] {
        return this.instance<G>().get(key, orElse);
    }
    public static set<G extends GlobalConfiguration = GlobalConfiguration>(key: keyof G, value?: G[keyof G]): Configuration<G> {
        return this.instance<G>().set(key, value);
    }
    public static has<G extends GlobalConfiguration = GlobalConfiguration>(key: keyof G): boolean {
        return this.instance<G>().has(key);
    }

}
