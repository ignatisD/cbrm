import IUser from "@interfaces/models/User";

export interface IDocument {
    _id?: string|any;
    createdAt?: Date|string;
    updatedAt?: Date|string;
}

export interface IDocumentWithUser extends IDocument {
    user: Partial<IUser>|string|any;
}
// TODO extend IDocument
export interface IDoc<T = any> {
    toObject?: <P extends T>(options?: any) => P;
    toJSON?: (options?: any) => any;
}

export type Doc<T = any> = T & IDoc<T>;
