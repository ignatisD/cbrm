import { Generic } from "es7/api/requestParams";
import IError from "@interfaces/common/Error";
import IPaginatedResults from "@interfaces/helpers/PaginatedResults";

export type IEsOperation = "index"|"create"|"update"|"delete";
export type RefreshCommand = boolean|"wait_for";
export interface IElasticParams<B = any, R = RefreshCommand> extends Generic {
    id?: string;
    index: string;
    refresh?: R;
    scroll?: string;
    body: B;
    pipeline?: string;
    op_type?: any;
}

export interface IElasticIdParams<B = any, R = RefreshCommand> extends Generic {
    id: string;
    index: string;
    refresh?: R;
}

export interface IElasticIdBodyParams<B = any, R = RefreshCommand> extends Generic {
    id: string;
    index: string;
    refresh?: R;
    body: B;
}

export interface IShardsResponse {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
}

export interface IExplanation {
    value: number;
    description: string;
    details: IExplanation[];
}
export interface IHit<T> {
    _index: string;
    _type: string;
    _id: string;
    _score: number;
    _source: T;
    _version?: number;
    _explanation?: IExplanation;
    fields?: any;
    highlight?: any;
    inner_hits?: any;
    matched_queries?: string[];
    sort?: string[];
}
export interface IBodyHits<T> {
    total: {
        value: number;
        relation: string
    };
    max_score: number;
    hits: IHit<T>[];
}
export interface ISearchResponse<T> {
    took: number;
    timed_out: boolean;
    _scroll_id?: string;
    _shards: IShardsResponse;
    hits: IBodyHits<T>;
    aggregations?: any;
}

export interface ICountResponse {
    took: number;
    count: number;
    _shards: IShardsResponse;
}

export interface IBulkOpBody {
    _index: string;
    _type: string;
    _id: string;
    _version: number;
    forced_refresh?: boolean;
    error?: any;
    result: string;
    _shards: {
        total: number;
        successful: number;
        failed: number;
    };
    status: number;
    _seq_no: number;
    _primary_term: number;
}

export interface IBulkOp {
    index?: IBulkOpBody;
    create?: IBulkOpBody;
    delete?: IBulkOpBody;
    update?: IBulkOpBody;
}
export interface IBulkResponse {
    took: number;
    errors: any;
    items: IBulkOp[];
}

export interface IEsWriteResponse<T = any> {
    _id: string;
    _index: string;
    _version: number;
    refresh: boolean;
    result: string;
    doc?: Partial<T>;
    error?: IError;
}
export interface IOp {
    _id?: string;
    _index: string;
}
export interface IEsOp {
    create?: IOp;
    update?: IOp;
    delete?: IOp;
    index?: IOp;
}
export type IBulkBody<T> = (IEsOp|Partial<T>|{doc?: Partial<T>; script?: any})[];

export interface IBulk<T> {
    body: IBulkBody<T>;
    refresh: RefreshCommand;
}
export interface IAggregationResponse<T = any, A = any> {
    hits: IPaginatedResults<T>;
    aggregations: A;
}
export interface IBucket {
    key: string;
    key_as_string?: string;
    doc_count: number;
}
export interface ITermsBucket<B = IBucket> {
    doc_count_error_upper_bound: number;
    sum_other_doc_count: number;
    buckets: B[];
}

export type EsBody<T> = Pick<Partial<T>, Exclude<keyof T, "id"|"index"|"_id"|"_index"|"_version">>;

export interface IAggResponse {
    took?: number;
    count?: number;
}
