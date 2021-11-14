import { pick } from "lodash";
import IRepository from "../interfaces/repository/Repository";
import { IModel } from "../interfaces/models/Model";
import IUser from "../interfaces/models/User";

export default abstract class Repository<T extends IModel> implements IRepository {

    protected _user: Partial<IUser>;
    protected _modelName: string;
    protected readonly _model: T;

    protected constructor(model: T) {
        this._model = model;
        this._modelName = this.model?.modelName || this.model?.className || "Unknown";
    }

    public get model(): T {
        return this._model;
    }

    public get modelName() {
        return this._modelName;
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

    public emptyPaginatedResults(docs: any[] = []) {
        return {docs: docs, limit: -1, total: docs.length, page: 1, pages: 1, offset: 0, hasNextPage: false, hasPrevPage: false, pagingCounter: 1};
    }
}
