import IUser from "@interfaces/models/User";

export default interface IRepository {
    model: any;
    modelName: string;
    repoUser: any;
    addUser: (user: Partial<IUser>, socket?: string|string[]) => this;
}