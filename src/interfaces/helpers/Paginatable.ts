import "mongoose-paginate-v2";
import { EnforceDocument, PaginateModel, Aggregate } from "mongoose";
import IPaginatedResults from "@interfaces/helpers/PaginatedResults";
import { ISearchTermsOptions } from "@interfaces/helpers/SearchTerms";

export default interface IPaginatable<T extends EnforceDocument<any, any, any>> extends PaginateModel<T> {
    setDefaultLanguage(lang: string);
    aggregatePaginate(aggregation: Aggregate<any[]>, opts: ISearchTermsOptions): IPaginatedResults<any>;
}
