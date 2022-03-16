import { Request } from "express";
import { pick } from "lodash";
import { IBusinessLike, IBusinessRegistry } from "../interfaces/business/BusinessLike";
import { IController } from "../interfaces/controllers/Controller";
import { IUser } from "../interfaces/models/User";
import { IError } from "../interfaces/helpers/Error";
import { Logger } from "../helpers/Logger";

export abstract class Controller<T extends IBusinessLike> implements IController<T> {
    protected _business: new() => T;
    protected readonly _name: string;
    protected readonly _namePlural: string;
    protected readonly _instance: T;

    protected constructor(business: new() => T, name: string = "data", plural: string = "data") {
        this._name = name;
        this._namePlural = plural;
        this._business = business;
        this._instance = new business();
    }

    protected business(req?: Request) {
        return new this._business().fromRequest(req);
    }

    protected reqUser(req: Request) {
        return {
            controller: this.constructor?.name,
            user: pick(<IUser>req.user, ["_id", "fullName", "firstName", "lastName", "email"])
        };
    }

    get model(): string {
        return this._instance.modelName;
    }

    public registry(): IBusinessRegistry<T> {
        return {
            name: this._instance.constructor.name,
            business: this._business
        };
    }

    public exception(req: Request, e: IError, method?: string, details?: any): void {
        Logger.exception(e, {
            method: method,
            ...this.reqUser(req),
            details
        });
    }

}
