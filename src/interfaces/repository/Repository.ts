import IUser from "../models/User";

export default interface IRepository {
    model: any;
    modelName: string;
    repoUser: any;
    addUser: (user: Partial<IUser>, socket?: string|string[]) => this;
    populate: (docs: any, st: any) => any;
}
