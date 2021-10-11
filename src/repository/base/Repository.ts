import { IModel } from "@interfaces/models/base/Model";
import IRepository from "@interfaces/repository/Repository";
import IUser from "@interfaces/models/User";
import { pick } from "lodash";

export default abstract class Repository<T extends IModel> implements IRepository {

    protected _user: Partial<IUser>;
    protected readonly _model: T;

    protected constructor(model: T) {
        this._model = model;
    }

    public get model(): T {
        return this._model;
    }

    public get modelName() {
        return this.model.modelName;
    }

    public addUser(user: Partial<IUser>) {
        this._user = user;
        return this;
    }

    public get repoUser() {
        return {
            repository: this.constructor?.name,
            user: pick(this._user, ["_id", "fullName", "firstName", "lastName", "email"])
        };
    }

}