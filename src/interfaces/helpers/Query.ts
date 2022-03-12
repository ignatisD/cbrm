import { ReadPreference } from "./ReadPreference";

export type IFilterOp = "$nested"|"$or"|"$and"|"$nin"|"$in"|"$ne"|"$gte"|"$gt"|"$lt"|"$lte"|"$eq"|"$regex"|"$exists"|"$elemMatch"|"$bool"|"$text";
export interface IFilter {
    key: string;
    value: any;
    op: IFilterOp;
}
export interface ISearchTermsSortOptions {
    multiLangFields: string[];
}
export interface IPopulate {
    path: string; // the path to populate
    pathProp?: string; // used as an alternative path to get the actual property value

    select?: string;
    populate?: IPopulate[];

    business?: string; // used for populating any object by accessing each property's business
    index?: string;
    prop?: string; // used together along with filters to search by another property instead of the default _id
    filters?: any; // extra filters used in custom populate
    multiple?: string; // Allow multiple results
    match?: any; // extra filters for mongoose
    options?: any; // optional query options like sort, limit, etc
    model?: string; // Model name to be able to populate an object with mongoose
    pointer?: string; // Model name to be able to populate an object with mongoose

    markForSkip?: boolean;
    strictPopulate?: boolean;
}
export interface IQueryOptions {
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

export interface IQuery {
    id?: string;
    user?: string;
    index?: string;
    read?: ReadPreference;
    refresh?: boolean|"wait_for";
    slices?: number;
    scroll?: number; // seconds between requests
    scrollId?: string;
    locale?: string;
    token?: string;
    useMasterKey?: boolean;
    debug?: boolean;
    filters?: any;
    opFilters?: IFilter[];
    raw?: any;
    projection?: any;
    options?: IQueryOptions;
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
