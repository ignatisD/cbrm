import { ISearchTerms } from "@interfaces/helpers/SearchTerms";
import { IMappingResponse } from "@interfaces/helpers/Mapping";
import IBusinessLike from "@interfaces/business/BusinessLike";
import IPaginatedResults from "@interfaces/helpers/PaginatedResults";

export default interface IBusinessBase<T = any> extends IBusinessLike {
    create: (item: Partial<T>|any, refresh?: any) => Promise<any>;
    createMany: (items: Partial<T>[], refresh?: any) => Promise<any>;

    retrieve: (terms: ISearchTerms) => Promise<IPaginatedResults<T>>;
    search: (terms: ISearchTerms) => Promise<IPaginatedResults<T>>;
    find: (terms: ISearchTerms) => Promise<T[]>;
    findById: (terms: ISearchTerms) => Promise<T>;
    findOne: (terms: ISearchTerms) => Promise<T>;

    update: (id: string, params: Partial<T>|any, refresh?: any) => Promise<any>;
    updateMany: (params: any, props?: any) => Promise<any>;
    updateManyWithDifferentValues: (params: any, refresh?: any) => Promise<any>;
    updateOrCreate: (params: Partial<T>, props?: any) => Promise<any>;
    updateOrCreateMany: (params: Partial<T>[], props?: any) => Promise<any>;

    delete: (id: string, params?: any, refresh?: any) => Promise<any>;
    deleteMany: (params: any) => Promise<any>;

    restore: (id: string) => Promise<any>;
    duplicate: (terms: ISearchTerms) => Promise<any>;

    count: (terms: ISearchTerms) => Promise<number>;
    getMapping: (modelOnly?: boolean) => IMappingResponse|any;
    ensureMapping: (mode?: any) => Promise<any>;
}
