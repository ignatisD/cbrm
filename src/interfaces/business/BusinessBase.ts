import { IQuery } from "../helpers/Query";
import { IMappingResponse } from "../helpers/Mapping";
import IBusinessLike from "../business/BusinessLike";
import IPaginatedResults from "../helpers/PaginatedResults";

export default interface IBusinessBase<T = any> extends IBusinessLike {
    create: (item: Partial<T>|any, refresh?: any) => Promise<any>;
    createMany: (items: Partial<T>[], refresh?: any) => Promise<any>;

    retrieve: (terms: IQuery) => Promise<IPaginatedResults<T>>;
    search: (terms: IQuery) => Promise<IPaginatedResults<T>>;
    find: (terms: IQuery) => Promise<T[]>;
    findById: (terms: IQuery) => Promise<T>;
    findOne: (terms: IQuery) => Promise<T>;

    update: (id: string, params: Partial<T>|any, refresh?: any) => Promise<any>;
    updateMany: (params: any, props?: any) => Promise<any>;
    updateManyWithDifferentValues: (params: any, refresh?: any) => Promise<any>;
    updateOrCreate: (params: Partial<T>, props?: any) => Promise<any>;
    updateOrCreateMany: (params: Partial<T>[], props?: any) => Promise<any>;

    delete: (id: string, params?: any, refresh?: any) => Promise<any>;
    deleteMany: (params: any) => Promise<any>;

    restore: (id: string) => Promise<any>;
    duplicate: (terms: IQuery) => Promise<any>;

    count: (terms: IQuery) => Promise<number>;
    getMapping: (modelOnly?: boolean) => IMappingResponse|any;
    ensureMapping: (mode?: any) => Promise<any>;
}
