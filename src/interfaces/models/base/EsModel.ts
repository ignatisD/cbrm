import { IModel } from "@interfaces/models/base/Model";
import { IMappingProperty } from "@interfaces/helpers/Mapping";
import { IDoc } from "@interfaces/models/base/ModelBase";

type EsType = "alias"|"boolean"|"binary"|"object"|"nested"|"ip"|"completion"|"token_count"|"murmur3";
type EsGeoType = "geo_point"|"geo_shape"|"shape";
type EsComplexType = "percolator"|"join"|"rank_feature"|"rank_features"|"dense_vector"|"sparse_vector"|"dynamic_type";
type EsStringType = "keyword"|"text"|"annotated-text"|"search_as_you_type"|"flattened";
type EsNumericType = "long"|"integer"|"short"|"byte"|"double"|"float"|"half_float"|"scaled_float";
type EsDateType = "date"|"date_nanos";
type EsRangeType = "integer_range"|"float_range"|"long_range"|"double_range"|"date_range";
type EsTypes = EsType|EsGeoType|EsComplexType|EsStringType|EsNumericType|EsDateType|EsRangeType;

type EsAnalyzer = "standard"|"english";

export interface IEsMapping {
    _meta?: IMappingProperty;
    type?: EsTypes;
    analyzer?: EsAnalyzer;
    normalizer?: "string";
    boost?: number;
    coerce?: boolean;
    copy_to?: string;
    doc_values?: boolean;
    dynamic?: true|false|"strict";
    enabled?: boolean;
    fielddata?: boolean; // for text type
    eager_global_ordinals?: boolean;
    format?: string;
    ignore_above?: number; // string length
    ignore_malformed?: boolean;
    index_options?: "docs"|"freqs"|"positions"|"offsets";
    index_phrases?: boolean;
    index_prefixes?: {
        min_chars?: number;
        max_chars?: number;
    };
    index?: boolean;
    fields?: { [key: string]: IEsMapping };
    norms?: boolean;
    null_value?: string; // "NULL" : The null_value parameter allows you to replace explicit null values with the specified value
    position_increment_gap?: number;
    search_analyzer?: EsAnalyzer;
    similarity?: "BM25"|"classic"|"boolean";
    store?: boolean;
    term_vector?: "no"|"yes"|"with_positions"|"with_offsets"|"with_positions_offsets"|"with_positions_payloads"|"with_positions_offsets_payloads";

    path?: string; // for 'alias' type
    relations?: any; // for 'join' type
    properties?: {
        [key: string]: IEsMapping;
    };
}
export interface IEsRegex {
    value: string;
    flags?: string;
    case_insensitive?: boolean;
    max_determinized_states?: number;
    rewrite?: string;
}
export interface IEsProcessor {
    [key: string]: any;
}
export interface IEsPipeline {
    id: string;
    body: {
        description: string;
        processors: IEsProcessor[];
    };
}
export enum MappingMode {
    ALL = 0,
    MAPPING = 1,
    TEMPLATE = 2
}
export interface IEsSettings {
    number_of_shards: number;
    number_of_replicas?: number;
    refresh_interval?: string;
    default_pipeline?: string;
}
export interface IEsSchemaSettings {
    virtuals: string[];
    toObject: {
        virtuals: boolean;
    };
}
export interface IEsMappingBody {
    version?: number;
    _meta?: any;
    index_patterns: string[];
    aliases?: {[str: string]: any};
    settings?: IEsSettings;
    mappings: {
        _source?: {
            enabled: boolean;
        };
        properties: {
            [key: string]: IEsMapping;
        };
    };
}
export interface IEsModel<T extends IEsDoc> extends IModel<T> {
    _index: string;
    _searchIndex: string;
    template?: string;
    mapping(): IEsMappingBody;
    pipeline(): IEsPipeline;
}
export interface IEsDoc extends IDoc<IEsDoc> {
    id?: string;
    index?: string;

    _id?: string;
    _index?: string;
    _version?: number;
    updatedAt?: string|Date;
}
