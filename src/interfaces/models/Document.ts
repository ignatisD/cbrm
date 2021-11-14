export interface IDocument {
    _id?: string|any;
    createdAt?: Date|string;
    updatedAt?: Date|string;
}

// TODO extend IDocument
export interface IDoc<T = any> {
    toObject?: <P extends T>(options?: any) => P;
    toJSON?: (options?: any) => any;
}

export type Doc<T = any> = T & IDoc<T>;
