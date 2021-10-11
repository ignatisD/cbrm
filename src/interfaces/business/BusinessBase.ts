import { ISearchTerms } from "@interfaces/helpers/SearchTerms";
import { IMappingResponse } from "@interfaces/helpers/Mapping";
import IBusinessLike from "@interfaces/business/BusinessLike";

export default interface IBusinessBase<T = any> extends IBusinessLike {
    create: (item: Partial<T>|any, refresh?: any) => Promise<any>;
    createMany: (items: Partial<T>[], refresh?: any) => Promise<any>;
    retrieve: (terms: ISearchTerms) => Promise<any>;
    search: (terms: ISearchTerms) => Promise<any>;
    find: (terms: ISearchTerms) => Promise<any>;
    findById: (terms: ISearchTerms) => Promise<any>;
    findOne: (terms: ISearchTerms) => Promise<any>;
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
