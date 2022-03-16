import { StateManager } from "./StateManager";
import { NewAble } from "../interfaces/helpers/NewAble";
import { IBusinessLike } from "../interfaces/business/BusinessLike";

export class Registry {

    protected static _instance: StateManager<Record<string, NewAble<IBusinessLike>>>;

    public static instance(): StateManager<Record<string, NewAble<IBusinessLike>>> {
        if (!this._instance) {
            this._instance = new StateManager<Record<string, NewAble<IBusinessLike>>>();
        }
        return this._instance;
    }

    public static get(key: string, orElse?: NewAble<IBusinessLike>): NewAble<IBusinessLike> {
        return this.instance().get(key, orElse);
    }
    public static set(key: string, value?: NewAble<IBusinessLike>): StateManager<Record<string, NewAble<IBusinessLike>>> {
        return this.instance().set(key, value);
    }
    public static has(key: string): boolean {
        return this.instance().has(key);
    }
}
