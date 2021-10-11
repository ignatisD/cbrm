export default interface IWrite<T> {
    create: (item: Partial<T>|any) => Promise<T|any>;
    createMany: (items: (Partial<T>|any)[], props?: any) => Promise<any>;
    insertMany: (items: (Partial<T>|any)[]) => Promise<(T[]|any)>;
    updateOne: (id: string, params: Partial<T>|any) => Promise<T|any>;
    updateMany: (params: any, props?: any) => Promise<any>;
    deleteOne: (params: any) => Promise<any|boolean>;
    deleteMany: (params: any) => Promise<any|number>;
}
