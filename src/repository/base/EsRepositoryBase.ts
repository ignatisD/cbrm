import * as bodyBuilder from "bodybuilder";
import { cloneDeep, omit } from "lodash";
import { IEsDoc, IEsMapping, IEsMappingBody, IEsModel, IEsRegex, MappingMode } from "@interfaces/models/base/EsModel";
import IPaginatedResults from "@interfaces/helpers/PaginatedResults";
import {
    EsBody,
    IAggregationResponse,
    IBulk,
    IBulkBody,
    IElasticIdBodyParams,
    IElasticIdParams,
    IElasticParams,
    IEsOp,
    IEsOperation,
    IEsWriteResponse,
    IHit,
    ISearchResponse,
    RefreshCommand
} from "@interfaces/helpers/Elastic";
import { ApiResponse, RequestParams } from "es7";
import { IFilter, ISearchTerms } from "@interfaces/helpers/SearchTerms";
import Repository from "@repository/base/Repository";
import ElasticClient from "@config/elastic";
import JsonResponse from "@helpers/JsonResponse";
import Pagination from "@helpers/Pagination";
import ResponseError from "@helpers/common/ResponseError";
import IRepositoryBase from "@interfaces/repository/RepositoryBase";
import IMapping, { IMappingResponse } from "@interfaces/helpers/Mapping";
import { DeleteByQuery } from "es7/api/requestParams";
import Helpers from "@helpers/Helpers";

export default class EsRepositoryBase<T extends IEsDoc = any> extends Repository<IEsModel<T>> implements IRepositoryBase<T> {

    protected readonly _client: ElasticClient;
    protected _builder: bodyBuilder.Bodybuilder;
    protected _took: number;
    protected _active: string = "active";

    constructor(modelFactory: IEsModel<T>) {
        super(modelFactory);
        this._client = ElasticClient.instance;
        this.rebuild();
        if (!this.model._index) {
            throw new Error("A default index must be defined on the target Model");
        }
    }

    public get today() {
        return "now/d";
    }

    public get index(): string {
        return this.model._index;
    }

    public get searchIndex(): string {
        return this.model._searchIndex;
    }

    public get client(): ElasticClient {
        return this._client;
    }

    public get builder(): bodyBuilder.Bodybuilder {
        return this._builder;
    }

    protected _buckets<A extends IAggregationResponse, K extends keyof A["aggregations"]>(agg: A, key: K): A["aggregations"][K]["buckets"] {
        return agg?.aggregations?.[key]?.buckets || [];
    }

    protected _omit(_doc: Partial<T>): EsBody<T> {
        return omit(_doc, ["id", "index", "_id", "_index", "_version"]);
    }

    protected _warn<R = IEsWriteResponse<T>>(res: ApiResponse) {
        const response = new JsonResponse<R>();
        if (res.warnings && res.warnings.length) {
            res.warnings.forEach((warning) => {
                response.error(warning, null, "Warning");
            });
        }
        if (res.body?.error) {
            response.error(res.body.error.reason, res.body.error.caused_by, res.body.error.type);
        }
        return response;
    }

    protected cleanSchema(properties: {[key: string]: IEsMapping}): {[key: string]: IEsMapping} {
        const schema = cloneDeep(properties);
        for (let key in schema) {
            if (!properties.hasOwnProperty(key)) {
                continue;
            }
            delete schema[key]._meta;
            if (schema[key].properties) {
                schema[key].properties = this.cleanSchema(schema[key].properties);
            }
        }
        return schema;
    }

    protected _normalizeMapping(properties: { [key: string]: IEsMapping }): IMapping {
        const normal: IMapping = {};
        for (let key in properties) {
            if (!properties.hasOwnProperty(key)) {
                continue;
            }
            const property = properties[key];
            const propertyType = property.type;
            normal[key] = {
                type: null,
            };
            switch (propertyType) {
                case "text":
                case "keyword":
                case "annotated-text":
                case "search_as_you_type":
                case "flattened":
                    if (!!properties[key]._meta) {
                        normal[key] = properties[key]._meta;
                        break;
                    }
                    normal[key].type = "string";
                    break;
                case "long":
                case "integer":
                case "short":
                case "byte":
                case "double":
                case "float":
                case "half_float":
                case "scaled_float":
                    normal[key].type = "number";
                    break;
                case "boolean":
                    normal[key].type = "boolean";
                    break;
                case "date":
                case "date_nanos":
                    normal[key].type = "date";
                    break;
                case "nested":
                    normal[key].type = "object";
                    normal[key].array = true;
                    normal[key].properties = this._normalizeMapping(property.properties);
                    break;
                case "object":
                    normal[key].type = "object";
                    normal[key].properties = this._normalizeMapping(property.properties);
                    if (property._meta?.properties) {
                        normal[key].properties = {
                            ...property._meta.properties,
                            ...normal[key].properties
                        };
                    }
                    break;
                default:
                    normal[key].type = "complex";
                    break;
            }
        }
        return normal;
    }

    public getBusiness(vatId: string): Object|null {
        return global.businessRegistry[vatId] || null;
    }

    public took(number?: number): number {
        if (number) {
            this._took = number;
        }
        return this._took;
    }

    public rebuild(temp: boolean = false): bodyBuilder.Bodybuilder {
        if (temp) {
            return bodyBuilder();
        }
        this._builder = bodyBuilder();
        return this._builder;
    }

    protected _elasticRegex(value: string | RegExp) {
        const result: IEsRegex = {
            value: (value || "").toString()
        };
        if (typeof value !== "string") {
            result.case_insensitive = value.flags.includes("i");
        }
        const matched = /^\/(.+)\/[gi]{0,2}$/.exec(result.value);
        if (matched) {
            result.value = matched[1];
        }
        return result;
    }

    protected _handleQuery(filter: IFilter, builder: bodyBuilder.Bodybuilder | bodyBuilder.FilterSubFilterBuilder): void {
        let t = Array.isArray(filter.value) ? "terms" : "term";
        switch (filter.op) {
            case "$exists":
                if (filter.value) {
                    builder.query("exists", {field: filter.key});
                } else {
                    builder.notQuery("exists", {field: filter.key});
                }
                break;
            case "$eq":
            case "$and":
            case "$in":
                if (filter.key === "ids" || filter.key === "_id") {
                    builder.query("ids", {values: filter.value});
                } else {
                    if (Array.isArray(filter.value) && filter.op === "$and") {
                        for (let v of filter.value) {
                            builder.query("term", filter.key, v);
                        }
                    } else {
                        builder.query(t, filter.key, filter.value);
                    }
                }
                break;
            case "$or":
                builder.orQuery(t, filter.key, filter.value);
                break;
            case "$nin":
            case "$ne":
                if (filter.key === "ids" || filter.key === "_id") {
                    builder.notQuery("ids", {values: filter.value});
                    return;
                } else {
                    builder.notQuery(t, filter.key, filter.value);
                }
                break;
            case "$regex":
                builder.query("regexp", filter.key, this._elasticRegex(filter.value));
                break;
            case "$lt":
            case "$lte":
            case "$gt":
            case "$gte":
                const value: any = {};
                value[filter.op.substring(1)] = filter.value;
                builder.query("range", filter.key, value);
                break;
            default:
                builder.query(t, filter.key, filter.value);
                break;
        }
    }

    protected _handleFilter(filter: IFilter, builder: bodyBuilder.Bodybuilder | bodyBuilder.FilterSubFilterBuilder): void {
        let t = Array.isArray(filter.value) ? "terms" : "term";
        switch (filter.op) {
            case "$exists":
                if (filter.value) {
                    builder.filter("exists", {field: filter.key});
                } else {
                    builder.notFilter("exists", {field: filter.key});
                }
                break;
            case "$eq":
            case "$and":
            case "$in":
                if (filter.key === "ids" || filter.key === "_id") {
                    builder.filter("ids", {values: filter.value});
                } else {
                    if (Array.isArray(filter.value) && filter.op === "$and") {
                        for (let v of filter.value) {
                            builder.filter("term", filter.key, v);
                        }
                    } else {
                        builder.filter(t, filter.key, filter.value);
                    }
                }
                break;
            case "$or":
                builder.orFilter(t, filter.key, filter.value);
                break;
            case "$elemMatch":
            case "$nested":
                if (typeof filter.value !== "object") {
                    builder.filter(t, filter.key, filter.value);
                    break;
                }
                const nestedBuilder = this.rebuild(true);
                if (filter.value?.op && filter.value.key && filter.value.value !== undefined) {
                    this._handleQuery({
                        key: filter.value.key,
                        value: filter.value.value,
                        op: filter.value.op
                    }, nestedBuilder);
                } else {
                    for (let key in filter.value) {
                        if (!filter.value.hasOwnProperty(key)) {
                            continue;
                        }
                        this._handleQuery({
                            key: key,
                            value: filter.value[key],
                            op: "$eq"
                        }, nestedBuilder);
                    }
                }
                builder.filter("nested", {
                    "path": filter.key,
                    ...nestedBuilder.build()
                });
                break;
            case "$nin":
            case "$ne":
                if (filter.key === "ids" || filter.key === "_id") {
                    builder.notFilter("ids", {values: filter.value});
                    return;
                } else {
                    builder.notFilter(t, filter.key, filter.value);
                }
                break;
            case "$regex":
                builder.filter("regexp", filter.key, this._elasticRegex(filter.value));
                break;
            case "$lt":
            case "$lte":
            case "$gt":
            case "$gte":
                const value: any = {};
                value[filter.op.substring(1)] = filter.value;
                builder.filter("range", filter.key, value);
                break;
            case "$bool":
                if (!Array.isArray(filter.value)) {
                    filter.value = [filter.value];
                }
                for (let v of filter.value) {
                    if (v?.opFilters?.length) {
                        let method = "addFilter";
                        if (filter.key === "or") {
                            method = "orFilter";
                        } else if (filter.key === "not") {
                            method = "notFilter";
                        } else {
                            method = "addFilter";
                        }
                        builder[method]("bool", sub => {
                            for (let f of v.opFilters) {
                                this._handleFilter(f, sub);
                            }
                            return sub;
                        });
                    }
                }
                break;
            default:
                builder.filter(t, filter.key, filter.value);
                break;
        }
        return;
    }

    public build(terms: ISearchTerms, builder: bodyBuilder.Bodybuilder = null): any {

        const limit = terms.options.limit || 0;
        const page = terms.options.page || 1;
        const offset = (page - 1) * limit;
        builder = builder ?? this.rebuild();
        builder
        .size(limit);

        if (!terms.scroll) {
            builder
            .from(offset);
        }

        if (terms.projection) {
            const projection = {
                excludes: [],
                includes: [],
            };
            Object.keys(terms.projection).forEach((p) => {
                if (!terms.projection[p]) {
                    projection.excludes.push(p);
                } else {
                    projection.includes.push(p);
                }
            });
            if (projection.excludes.length === 0) {
                delete projection.excludes;
            }
            if (projection.includes.length === 0) {
                delete projection.includes;
            }
            builder.rawOption("_source", projection);
        }
        const filters = terms.opFilters;
        filters.forEach((filter: IFilter) => {
            this._handleFilter(filter, builder);
        });
        if (terms.options.sort) {
            for (let key in terms.options.sort) {
                if (!terms.options.sort.hasOwnProperty(key)) {
                    continue;
                }
                const sort = terms.options.sort[key] === 1 ? "asc" : "desc";
                builder.sort(key, sort);
            }
        }
        builder.rawOption("track_total_hits", true);
        return builder.build();
    }

    public paginate(terms: ISearchTerms, hits: IHit<T>[] = [], total: number = 0): IPaginatedResults<T> {
        const pagination = new Pagination<T>();
        const limit = terms.options.limit || 10000;
        const page = terms.options.page || 1;
        pagination
        .setLimit(limit)
        .setPage(page)
        .setTotal(total);
        hits.forEach((hit: IHit<T>) => {
            const model: T = this.make({_id: hit._id, _index: hit._index, ...hit._source});
            model.id = hit._id;
            model.index = hit._index;
            pagination.addResult(model);
        });
        return pagination.itTook(this._took).sync().toObject();
    }

    public make(item?: any): T {
        return new this.model(item);
    }

    public mapping(): IMappingResponse {
        const mapping: IEsMappingBody = this.model.mapping();
        return {
            model: this.model.modelName,
            mapping: this._normalizeMapping(mapping.mappings.properties)
        };
    }

    async ensureMapping(mode: MappingMode = MappingMode.ALL): Promise<JsonResponse<IEsMappingBody>> {
        const response = new JsonResponse();
        try {
            let result: any;
            const pipeline = this.model.pipeline();
            if (pipeline) {
                const pipelineRes = await this.client.putPipeline(pipeline);
                response.set("pipeline", pipelineRes.body);
                result = pipelineRes.body || {};
                if (!result.acknowledged) {
                    if (pipelineRes.body && pipelineRes.body.error) {
                        response.error(pipelineRes.body.error.reason, pipelineRes.body.error.caused_by, pipelineRes.body.error.type);
                    }
                    response.setDebug(pipelineRes.body);
                    return response;
                }
            }
            const mapping: IEsMappingBody = this.model.mapping();
            mapping.mappings.properties = this.cleanSchema(mapping.mappings.properties);
            if (mode === MappingMode.ALL || mode === MappingMode.TEMPLATE) {
                const template: RequestParams.IndicesPutTemplate<IEsMappingBody> = {
                    name: this.model.template || mapping.index_patterns[0],
                    body: mapping
                };
                const templateRes = await this.client.putIndexTemplate(template);
                result = templateRes.body || {};
                response.set("template", templateRes.body);
                if (!result.acknowledged) {
                    response.setDebug(templateRes.body);
                    return response;
                }
            }
            if (mode === MappingMode.ALL || mode === MappingMode.MAPPING) {
                const putMapping: RequestParams.IndicesPutMapping<IEsMapping> = {
                    index: this.model._searchIndex,
                    body: {
                        properties: mapping.mappings.properties
                    }
                };
                const mappingRes = await this.client.putMapping(putMapping);
                response.set("mapping", mappingRes.body);
                result = mappingRes.body || {};
                if (!result.acknowledged) {
                    if (mappingRes.body && mappingRes.body.error) {
                        response.error(mappingRes.body.error.reason, mappingRes.body.error.caused_by, mappingRes.body.error.type);
                    }
                    response.setDebug(mappingRes.body);
                    return response;
                }
            }
            return response.ok(mapping);
        } catch (e) {
            Log.exception(e, this.repoUser);
            return JsonResponse.caught(e);
        }
    }

    async populate(docs: T, st: ISearchTerms): Promise<T>;
    async populate(docs: T[], st: ISearchTerms): Promise<T[]>;
    async populate(docs: T[]|T, st: ISearchTerms) {
        return Helpers.populate(docs, st);
    }

    async insertMany(items: T[]): Promise<JsonResponse<IEsWriteResponse<T>[]>> {
        return await this._bulk(items, "create");
    }

    async create(_doc: Partial<T>, refresh: RefreshCommand = false): Promise<JsonResponse<IEsWriteResponse<T>>> {
        try {
            const body = this._omit(_doc);
            const params: IElasticIdBodyParams<EsBody<T>> = {
                id: _doc.id,
                index: _doc.index,
                body: body,
                refresh: refresh
            };
            const res = await this.client.create<EsBody<T>>(params);
            const response = this._warn(res);
            const resBody: any = res.body || {};
            const result: IEsWriteResponse<T> = {
                _id: resBody._id,
                _index: resBody._index,
                _version: resBody?._version,
                refresh: resBody.forced_refresh,
                doc: _doc,
                result: resBody.result,
            };
            if (result._id) {
                return response.ok(result);
            }
            return response.setDebug(result);
        } catch (e) {
            Log.exception(e, this.repoUser);
            return JsonResponse.caught(e);
        }
    }

    async createMany(items: Partial<T>[], refresh: RefreshCommand = false): Promise<JsonResponse<IEsWriteResponse<T>[]>> {
        return await this._bulk(items, "create", refresh);
    }

    async updateOrCreate(_doc: Partial<T>, refresh: RefreshCommand = false): Promise<JsonResponse<IEsWriteResponse<T>>> {
        try {
            const body = this._omit(_doc);
            const params: IElasticParams<EsBody<T>> = {
                id: _doc.id,
                index: _doc.index,
                body: body,
                refresh: refresh
            };
            const res = await this.client.index<EsBody<T>>(params);
            const response = this._warn(res);
            const resBody: any = res.body || {};
            const result: IEsWriteResponse<T> = {
                _id: resBody._id,
                _index: resBody._index,
                _version: resBody._version,
                refresh: resBody.forced_refresh,
                doc: _doc,
                result: resBody.result,
            };
            if (result._id) {
                return response.ok(result);
            }
            return response.setDebug(result);
        } catch (e) {
            Log.exception(e, this.repoUser);
            return JsonResponse.caught(e);
        }
    }

    async updateOrCreateMany(items: Partial<T>[], refresh: RefreshCommand = false): Promise<JsonResponse<IEsWriteResponse<T>[]>> {
        return await this._bulk(items, "index", refresh);
    }

    async retrieve(terms: ISearchTerms): Promise<JsonResponse<IPaginatedResults<T>>> {
        return await this.search(terms);
    }

    protected async _handleResults(terms: ISearchTerms, res: ApiResponse<ISearchResponse<T>>, body?: any): Promise<JsonResponse<IPaginatedResults<T>>> {
        const response = this._warn<IPaginatedResults<T>>(res);
        const hits: IHit<T>[] = res.body?.hits?.hits || [];
        const total = res.body?.hits?.total?.value || 0;
        this.took(res.body?.took);
        if (terms.scroll && res.body?._scroll_id) {
            terms.scrollId = res.body._scroll_id;
        }
        const results = this.paginate(terms, hits, total);
        if (response.errors) {
            results.errors = response.errors;
        }
        if (terms.options?.populate.length && results.docs?.length) {
            results.docs = await this.populate(results.docs, terms);
        }
        if (terms.debug) {
            results.debug = {
                req: body,
                res: res.body
            };
        }
        return response.check(response.errors, results);
    }

    async asyncSearch(terms: ISearchTerms): Promise<JsonResponse<IPaginatedResults<T>>> {
        try {
            const body = terms.raw ?? this.build(terms);
            const params: IElasticParams = {
                index: terms.index || this.searchIndex,
                body: body
            };
            const res = await this.client.asyncSearchSubmit<IElasticParams, T>(params);
            return await this._handleResults(terms, res, body);
        } catch (e) {
            Log.exception(e, this.repoUser);
            return JsonResponse.caught(e);
        }
    }

    async search(terms: ISearchTerms): Promise<JsonResponse<IPaginatedResults<T>>> {
        try {
            const body = terms.raw ?? this.build(terms);
            const params: IElasticParams = {
                index: terms.index || this.searchIndex,
                body: body
            };
            if (terms.scroll) {
                params.scroll = `${terms.scroll}s`;
            }
            const res = await this.client.search<IElasticParams, T>(params);
            return await this._handleResults(terms, res, body);
        } catch (e) {
            Log.exception(e, this.repoUser);
            return JsonResponse.caught(e);
        }
    }

    async scroll(terms: ISearchTerms): Promise<JsonResponse<IPaginatedResults<T>>> {
        if (!terms.scroll || !terms.scrollId) {
            return new JsonResponse<IPaginatedResults<T>>().ok(new Pagination())
            .addError(new ResponseError("ScrollMissing", "Scroll params are required"))
            .setDebug(terms);
        }
        const params = {
            scroll_id: terms.scrollId,
            scroll: `${terms.scroll}s`
        };
        const res = await this.client.scroll(params);
        return await this._handleResults(terms, res, params);
    }

    async * scrollSearch (terms: ISearchTerms): AsyncGenerator<IPaginatedResults<T>, void> {
        if (!terms.scroll) {
            terms.scroll = 20;
        }
        let response = await this.search(terms);
        while (true) {
            const paginated: IPaginatedResults<T> = response.get() ?? new Pagination().setDebug(response.debug, response.errors);
            if (!response.success) {
                break;
            }
            if (!paginated.docs?.length) {
                break;
            }

            yield paginated;

            if (!terms.scrollId || !terms.scroll) {
                break;
            }
            response = await this.scroll(terms);
        }
    }

    async find(terms: ISearchTerms): Promise<JsonResponse<IPaginatedResults<T>>> {
        return await this.search(terms);
    }

    async findById(terms: ISearchTerms): Promise<JsonResponse<T>> {
        try {
            terms.setPaging(1, 1);
            const body = this.build(terms);
            const params: IElasticParams = {
                index: terms.index || this.searchIndex,
                body: body
            };
            const res = await this.client.search<IElasticParams, T>(params);
            const response = this._warn<T>(res);
            if (!res.body?.hits) {
                if (response.errors) {
                    Log.error("findById: " + response.reason());
                }
                return response.error("Error").setDebug({
                    req: body,
                    res: res.body
                });
            }
            this.took(res.body?.took);
            const doc: IHit<T> = res.body?.hits?.hits[0];
            if (!doc) {
                return response.error("Not found").setDebug({
                    req: body,
                    res: res.body
                });
            }
            let result: T = this.make(doc._source);
            result.id = doc._id;
            result.index = doc._index;
            if (terms.options?.populate.length) {
                result = await this.populate(result, terms);
            }
            response.setDebug({
                req: body
            });
            return response.ok(result);
        } catch (e) {
            Log.exception(e, this.repoUser);
            return JsonResponse.caught(e);
        }
    }

    async findOne(terms: ISearchTerms) {
        try {
            terms.setPaging(0, 1);
            const body = terms.raw ?? this.build(terms);
            const params: IElasticParams = {
                index: terms.index || this.searchIndex,
                body: body
            };
            const res = await this.client.search<IElasticParams, T>(params);
            const response = this._warn<T>(res);
            if (!res.body?.hits) {
                if (response.errors) {
                    Log.error("findOne: " + response.reason());
                }
                return response.setDebug({
                    req: body,
                    res: res.body
                });
            }
            this.took(res.body?.took);
            const doc: IHit<T> = res.body?.hits.hits[0];
            if (!doc) {
                return response.error("Not found").setDebug({
                    req: body,
                    res: res.body
                });
            }
            let result: T = this.make(doc._source);
            result.id = doc._id;
            result.index = doc._index;
            if (terms.options?.populate.length) {
                result = await this.populate(result, terms);
            }
            response.setDebug({
                req: body
            });
            return response.ok(result);
        } catch (e) {
            Log.exception(e, this.repoUser);
            return JsonResponse.caught(e);
        }
    }

    async updateOne(id: string, _doc: Partial<T>, refresh: RefreshCommand = false): Promise<JsonResponse> {
        try {
            const body = this._omit(_doc);
            const params: IElasticIdBodyParams = {
                id: id,
                index: _doc.index,
                body: {
                    doc: body
                },
                refresh: refresh
            };
            const res = await this.client.update(params);
            const response = this._warn(res);
            const resBody: any = res.body || {};
            const result: IEsWriteResponse<T> = {
                _id: resBody._id,
                _index: resBody._index,
                _version: resBody._version,
                refresh: resBody.forced_refresh,
                doc: _doc,
                result: resBody.result,
            };
            if (result._id) {
                return response.ok(result);
            }
            return response.setDebug(result);
        } catch (e) {
            Log.exception(e, this.repoUser);
            return JsonResponse.caught(e);
        }
    }

    /**
     * ! Warning! use with caution
     * @param terms
     * @param item
     */
    async updateMany(terms: ISearchTerms, item: Partial<T> | any): Promise<JsonResponse<number>> {
        try {
            const q = terms.raw ?? this.build(terms);
            let scriptParams: any = {};
            let script = "";
            let delimiter = "";
            Object.keys(item).forEach(key => {
                let value: any = item[key];
                switch (typeof value) {
                    case "number":
                    case "boolean":
                    case "string":
                        break;
                    case "undefined":
                        value = "null";
                        break;
                    case "object":
                        if (value instanceof Date) {
                            value = value.toISOString();
                        }
                        break;
                    default:
                        return;
                }
                script += delimiter + `ctx._source.${key} = params['${key}']`;
                scriptParams[key] = value;
                delimiter = "; ";
            });
            const params: RequestParams.UpdateByQuery = {
                index: terms.index || this.searchIndex,
                conflicts: "proceed",
                refresh: terms.refresh === true,
                body: {
                    script: {
                        source: script,
                        params: scriptParams,
                        lang: "painless"
                    },
                    query: q.query
                }
            };
            const res = await this.client.updateByQuery(params);
            this.took(res.body?.took);
            const response = this._warn<number>(res);
            const resBody: any = res.body || {};
            if (terms.debug) {
                response.setDebug({
                    took: this._took,
                    req: params.body,
                    res: resBody
                });
            }
            if (!response.success) {
                return response;
            }
            return response.ok(resBody.updated, "updated").set("total", resBody.total).set("deleted", resBody.deleted).set("noop", resBody.noops);
        } catch (e) {
            Log.exception(e, this.repoUser);
            return JsonResponse.caught(e);
        }
    }

    async updateManyWithDifferentValues(items: Partial<T>[], refresh: RefreshCommand = false): Promise<JsonResponse> {
        return await this._bulk(items, "update", refresh);
    }

    /**
     * Tested (requires index alias to be set on the index template)
     * @param id
     * @param index
     * @param refresh
     */
    async deleteById(id: string, index?: string, refresh: RefreshCommand = false): Promise<JsonResponse<IEsWriteResponse<T>>> {
        try {
            if (!id) {
                return new JsonResponse().error("Document `id` is required");
            }
            const params: IElasticIdParams = {
                id: id,
                index: index || this.searchIndex,
                refresh: refresh
            };
            const res = await this.client.delete(params);
            const response = this._warn(res);
            const resBody: any = res.body || {};
            const result: IEsWriteResponse<T> = {
                _id: resBody._id,
                _index: resBody._index,
                _version: resBody._version,
                refresh: resBody.forced_refresh,
                result: resBody.result,
            };
            if (result._id) {
                return response.ok(result);
            }
            return response.setDebug(result);
        } catch (e) {
            Log.exception(e, this.repoUser);
            return JsonResponse.caught(e);
        }
    }

    async deleteOne(terms: ISearchTerms): Promise<JsonResponse<number>> {
        terms.setPaging(1, 1);
        return await this.deleteMany(terms);
    }

    async deleteMany(terms: ISearchTerms): Promise<JsonResponse<number>> {
        try {
            const q = terms.raw ?? this.build(terms);
            const params: DeleteByQuery = {
                index: terms.index || this.searchIndex,
                refresh: terms.refresh === true,
                conflicts: "proceed",
                body: {
                    query: q.query
                }
            };
            if (terms.slices) {
                params.slices = terms.slices;
            }
            if (terms.options.limit === 1) {
                params.max_docs = 1;
                delete params.slices;
            }
            const res = await this.client.deleteByQuery(params);
            this.took(res.body?.took);
            const response = this._warn(res);
            const resBody: any = res.body || {};
            if (terms.debug) {
                response.setDebug({
                    took: this._took,
                    req: params.body,
                    res: resBody
                });
            }
            if (resBody?.failures?.length) {
                response.set("failures", resBody?.failures.length);
            }
            return new JsonResponse<number>().ok(resBody.total, "deleted").setDebug(resBody);
        } catch (e) {
            Log.exception(e, this.repoUser);
            return JsonResponse.caught(e);
        }
    }

    async deleteBulk(items: Partial<T>[], refresh: RefreshCommand = false): Promise<JsonResponse<IEsWriteResponse<T>[]>> {
        return await this._bulk(items, "delete", refresh);
    }

    async count(terms: ISearchTerms): Promise<JsonResponse<number>> {
        try {
            const q = terms.raw ?? this.build(terms);
            const params: IElasticParams = {
                index: terms.index || this.searchIndex,
                body: {
                    query: q.query
                }
            };
            const res = await this.client.count<IElasticParams>(params);
            const response = this._warn<number>(res);
            const count: number = res.body?.count || 0;
            if (terms.debug) {
                response.setDebug({
                    req: params.body,
                    res: res.body
                });
            }
            return response.ok(count);
        } catch (e) {
            Log.exception(e, this.repoUser);
            return JsonResponse.caught(e);
        }
    }

    async aggregate<A = any>(terms: ISearchTerms): Promise<JsonResponse<IAggregationResponse<T, A>>> {
        try {
            const body = terms.raw ?? this.build(terms);
            const params: IElasticParams = {
                index: terms.index || this.searchIndex,
                body: body
            };
            const res = await this.client.search<IElasticParams, T>(params);
            const response = this._warn<IAggregationResponse<T, A>>(res);
            const hits: IHit<T>[] = res.body?.hits?.hits || [];
            const total = res.body?.hits?.total?.value || 0;
            this.took(res.body?.took);
            const results = this.paginate(terms, hits, total);
            if (terms.debug) {
                results.debug = res.body;
                response.setDebug({
                    req: body
                });
            }
            return response.set("data", {
                hits: results,
                aggregations: res.body?.aggregations || {}
            });
        } catch (e) {
            Log.exception(e, this.repoUser);
            return JsonResponse.caught(e);
        }
    }

    protected async _bulk(items: Partial<T>[], operation: IEsOperation = "index", refresh: RefreshCommand = false): Promise<JsonResponse<IEsWriteResponse<T>[]>> {
        try {
            if (!items.length) {
                return new JsonResponse<IEsWriteResponse<T>[]>().ok([], operation);
            }
            const body: IBulkBody<EsBody<T>> = [];
            items.forEach((item) => {
                const op: IEsOp = {};
                op[operation] = {
                    _index: item._index || this.index
                };
                if (item._id) {
                    op[operation]._id = item._id;
                }
                body.push(op);
                if (operation !== "delete") {
                    if (operation === "update") {
                        body.push({doc: this._omit(item)});
                    } else {
                        body.push(this._omit(item));
                    }
                }
            });
            const params: IBulk<EsBody<T>> = {
                refresh: refresh,
                body: body
            };
            const res = await this.client.bulk(params);
            this.took(res.body?.took);
            const response = this._warn<IEsWriteResponse<T>[]>(res);
            const results = res.body?.items;
            if (!results) {
                return response.setDebug(res.body);
            }
            const opResults: IEsWriteResponse<T>[] = [];
            results.forEach((result) => {
                const item = result[operation];
                const op: IEsWriteResponse<T> = {
                    _id: item._id,
                    _index: item._index,
                    _version: item._version,
                    refresh: !!item.forced_refresh,
                    result: item.result || "error"
                };
                if (item.error) {
                    op.error = new ResponseError(item.error.type, item.error.reason, item.error.caused_by);
                    response.error(item.error.reason, item.error.caused_by, item.error.type);
                }
                opResults.push(op);
            });
            if (response.errors?.length === opResults.length) {
                return response.check(response.errors, opResults, operation);
            }
            return response.ok(opResults, operation);
        } catch (e) {
            Log.exception(e, this.repoUser);
            return JsonResponse.caught(e);
        }
    }

    async clearScroll(terms: ISearchTerms) {
        try {
            if (!terms.scrollId) {
                return Promise.resolve(new JsonResponse().error("No scroll id provided"));
            }
            const params: RequestParams.ClearScroll = {
                scroll_id: terms.scrollId
            };
            const res = await this.client.clearScroll(params);
            const response = this._warn<number>(res);
            return response.ok(res.body);
        } catch (e) {
            Log.exception(e, this.repoUser);
            return JsonResponse.caught(e);
        }
    }
}
