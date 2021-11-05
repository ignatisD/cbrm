import IUser from "@interfaces/models/User";

export interface IModelBase {
    _id?: string|any;
    createdAt?: Date|string;
    updatedAt?: Date|string;
}

export interface IModelBaseWithUser extends IModelBase {
    user: Partial<IUser>|string|any;
}

export interface IDoc<T = any> {
    toObject?: <P extends T>(options?: any) => P;
    toJSON?: (options?: any) => any;
}

export type Doc<T = any> = T & IDoc<T>;
