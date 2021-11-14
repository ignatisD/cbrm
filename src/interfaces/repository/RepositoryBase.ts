import { IQuery } from "../helpers/Query";
import IRead from "../helpers/Read";
import IWrite from "../helpers/Write";
import IRepository from "../repository/Repository";

export default interface IRepositoryBase<T = any> extends IRead<T>, IWrite<T>, IRepository {
    ensureMapping: () => Promise<any>;
    search: (params: IQuery) => Promise<any>;
    find: (params: IQuery) => Promise<any>;
    updateOrCreate: (params: Partial<T>, props?: any) => Promise<any>;
    updateOrCreateMany?: (params: Partial<T>[], props?: any) => Promise<any>;
    deleteById: (id: string, params?: any) => Promise<any>;
    count: (terms: IQuery) => Promise<any>;
}

