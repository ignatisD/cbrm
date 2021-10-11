import { ISearchTerms } from "@interfaces/helpers/SearchTerms";
import IRead from "@interfaces/common/Read";
import IWrite from "@interfaces/common/Write";
import IRepository from "@interfaces/repository/Repository";

export default interface IRepositoryBase<T = any> extends IRead<T>, IWrite<T>, IRepository {
    ensureMapping: () => Promise<any>;
    search: (params: ISearchTerms) => Promise<any>;
    find: (params: ISearchTerms) => Promise<any>;
    updateOrCreate: (params: Partial<T>, props?: any) => Promise<any>;
    updateOrCreateMany?: (params: Partial<T>[], props?: any) => Promise<any>;
    deleteById: (id: string, params?: any) => Promise<any>;
    count: (terms: ISearchTerms) => Promise<any>;
}

export enum ReadPreference {
    PRIMARY = "primary",
    PRIMARY_PREFERRED = "primaryPreferred",
    SECONDARY = "secondary",
    SECONDARY_PREFERRED = "secondaryPreferred",
    NEAREST = "nearest"
}
