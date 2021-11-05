import { QueryPopulateOptions } from "mongoose";
import { ReadPreference } from "@interfaces/repository/RepositoryBase";
import { RefreshCommand } from "@interfaces/helpers/Elastic";

export type IFilterOp = "$nested"|"$or"|"$and"|"$nin"|"$in"|"$ne"|"$gte"|"$gt"|"$lt"|"$lte"|"$eq"|"$regex"|"$exists"|"$elemMatch"|"$bool";
export interface IFilter {
    key: string;
    value: any;
    op: IFilterOp;
}
export interface ISearchTermsSortOptions {
    multiLangFields: string[];
}
export interface IPopulate extends QueryPopulateOptions {
    path: string; // the path to populate
    pathProp?: string; // used as an alternative path to get the actual property value

    select?: string;
    populate?: IPopulate[];

    business?: string; // used for populating any object by accessing each property's business
    index?: string;
    prop?: string; // used together along with filters to search by another property instead of the default _id
    filters?: any; // extra filters used in custom populate
    match?: any; // extra filters for mongoose
    model?: string; // Model name to be able to populate an object with mongoose
    markForSkip?: boolean;
    strictPopulate?: boolean;
}
export interface ISearchTermsOptions {
    select?: string;
    collation?: any;
    language?: string;
    sort?: any;
    populate?: any|string|string[]|IPopulate[];
    autopopulate?: boolean;
    lean?: boolean;
    leanWithId?: boolean;
    offset?: number;
    page: number;
    limit: number;
    customLabels?: {
        docs: string;
        totalDocs: string;
        limit: string;
        page: string;
        totalPages: string;
        pagingCounter: string;
        nextPage: string;
        prevPage: string;
    };
}

export interface ISearchTerms {
    id?: string;
    user?: string;
    index?: string;
    read?: ReadPreference;
    refresh?: RefreshCommand;
    slices?: number;
    scroll?: number; // seconds between requests
    scrollId?: string;
    locale?: string;
    token?: string;
    debug?: boolean;
    filters?: any;
    opFilters?: IFilter[];
    raw?: any;
    projection?: any;
    options?: ISearchTermsOptions;

    setId?(id: string): ISearchTerms;
    setIndex?(index: string): ISearchTerms;
    setSlices?(slices: number): ISearchTerms;
    setScroll?(scrollSeconds: number, scrollId?: string): ISearchTerms;
    select?(fields: string): ISearchTerms;
    addSelect?(field: string, value?: number): ISearchTerms;
    searchIn?(textFields: string[]): ISearchTerms;
    setOption?(key: string, value: any): ISearchTerms;
    populate?(populates?: IPopulate[]|string[]): ISearchTerms;
    autopopulate?(autopopulate?: boolean): ISearchTerms;
    setPaging?(page: number, limit?: number): ISearchTerms;
    setLocale?(locale?: string): ISearchTerms;
    setFilters?(filters: any): ISearchTerms;
    setFilter?(key: string, val: any, op?: IFilterOp): ISearchTerms;
    removeFilter?(key: string): ISearchTerms;
    setLean?(lean: boolean): ISearchTerms;
    setSort?(sort: any): ISearchTerms;
    setToken?(token: string): ISearchTerms;
    /**
     * Adds 'Bearer' to the auth token and returns it
     */
    authorization?(): string;
    setProjectionForPaginate?(): ISearchTerms;
    readFrom?(pref: ReadPreference): ISearchTerms;
}

export interface IRequestMetadata {
    ip: string;
    userAgent: string;
    referrer: string;
    lang: string;
    clientVersion?: number;
}
export interface IRequestTerms {
    fields?: string;
    sort?: any;
    populate?: any|string|string[]|IPopulate[];
    lean?: boolean|string;
    page?: number|string;
    limit?: number|string;
    lang?: string;

    index?: string; // in elastic queries
    debug?: boolean|string;
    autopopulate?: boolean|string; // not used
    setDeepFilters?: boolean|string;
    raw?: any;
    opFilters?: IFilter[];

    [key: string]: any;
}
