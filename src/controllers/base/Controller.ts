import { Request } from "express";
import { pick } from "lodash";
import IBusinessLike from "@interfaces/business/BusinessLike";
import IController from "@interfaces/controllers/base/Controller";
import IUser from "@interfaces/models/User";

export default abstract class Controller<T extends IBusinessLike> implements IController {
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
}
