import { IQuery } from "./Query";

export interface IRead<T> {
    retrieve: (params: IQuery) => Promise<any>;
    findById: (searchTerms: IQuery) => Promise<T|any>;
    findOne: (searchTerms: IQuery) => Promise<T|any>;
}
