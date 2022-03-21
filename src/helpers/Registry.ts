import { NewAble } from "../interfaces/helpers/NewAble";
import { IBusinessLike } from "../interfaces/business/BusinessLike";
import { Storage } from "./Storage";

export class Registry extends Storage<Record<string, NewAble<IBusinessLike>>> {

    protected static _instance: Storage<Record<string, NewAble<IBusinessLike>>>;

    public static instance(): Storage<Record<string, NewAble<IBusinessLike>>> {
        if (!this._instance) {
            this._instance = new Storage<Record<string, NewAble<IBusinessLike>>>();
        }
        return this._instance;
    }

    public static get(key: string, orElse?: NewAble<IBusinessLike>): NewAble<IBusinessLike> {
        return this.instance().get(key, orElse);
    }
    public static set(key: string, value?: NewAble<IBusinessLike>): Storage<Record<string, NewAble<IBusinessLike>>> {
        return this.instance().set(key, value);
    }
    public static has(key: string): boolean {
        return this.instance().has(key);
    }
}
