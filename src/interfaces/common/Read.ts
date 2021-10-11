import { ISearchTerms } from "@interfaces/helpers/SearchTerms";

export default interface IRead<T> {
    retrieve: (params: ISearchTerms) => Promise<any>;
    findById: (searchTerms: ISearchTerms) => Promise<T|any>;
    findOne: (searchTerms: ISearchTerms) => Promise<T|any>;
}
