import { Request } from "express";
import { pick, escapeRegExp, cloneDeep } from "lodash";
import {
    IFilter,
    IFilterOp,
    IPopulate, IRequestMetadata, IRequestTerms,
    IQuery,
    ISearchTermsOptions,
    ISearchTermsSortOptions
} from "../interfaces/helpers/Query";
import Helpers from "./Helpers";
import { ReadPreference } from "../interfaces/helpers/ReadPreference";
import Logger from "./Logger";

export default class Query implements IQuery {

    public id: string;
    public user: string;
    public index: string;
    public read: ReadPreference;
    public token: string;
    public refresh: boolean|"wait_for";
    public slices: number;
    public scroll: number;
    public scrollId: string;
    public debug: boolean;
    public locale: string = global.defaultLanguage;
    /**
     * Query Filters to be used by MongoDB or Elastic
     */
    public filters: any = {};
    public opFilters: IFilter[] = [];
    public raw: any;
    public meta: IRequestMetadata;
    public projection: object;
    /**
     * MongoDB search related options
     */
    public options: ISearchTermsOptions = {
        page: 1,
        limit: global.pagingLimit,
        autopopulate: false,
        populate: [],
        customLabels: {
            docs: "docs",
            totalDocs: "total",
            limit: "limit",
            page: "page",
            totalPages: "pages",
            pagingCounter: "pagingCounter",
            nextPage: "nextPage",
            prevPage: "prevPage",
        }
    };

    constructor(limit?: number, st?: IQuery) {
        if (limit) {
            this.options.limit = limit < 0 ? undefined : limit;
        }

        if (st) {
            this.setLocale(st.locale);
            this.setUser(st.user);
        }
    }

    public static fromRequest(req: Request) {
        const st = new Query();
        const data: IRequestTerms = {...req.query, ...req.body};
        const setDeepFilters = data.setDeepFilters;
        st.setLocale(req.getLocale());
        st.meta = Query.requestMeta(req);

        let limit = data.limit === "0" || data.limit === 0 ? -1 : parseInt((data.limit || global.pagingLimit).toString());
        limit = limit < -1 ? global.pagingLimit : limit;

        st.setPaging(parseInt((data.page || 1).toString()), limit);

        Helpers.isTrue(data.lean) && st.setLean(true);
        !Helpers.isEmpty(data.fields) && st.select(data.fields);

        if (req.user) {
            st.setUser(req.user._id);
        }
        st.setSort(data.sort);
        st.checkPopulate(data.populate);

        if (Helpers.isTrue(data.debug)) {
            st.debug = true;
        }
        if (data.index) {
            st.setIndex(data.index);
        }
        if (Helpers.isTrue(data.autopopulate)) {
            st.options.autopopulate = true;
        }
        delete data.index;
        delete data.debug;
        delete data.autopopulate;
        delete data.populate;
        delete data.lang;
        delete data.page;
        delete data.limit;
        delete data.lean;
        delete data.fields;
        delete data.sort;
        delete data.setDeepFilters;

        // Everything else still available in `data` is considered a filter
        st.setFilters(data, Helpers.isTrue(setDeepFilters));

        return st;
    }

    /**
     * Returns a fresh SearchTerms object with the default paging and language
     */
    public static fromScratch(cloneTerms?: IQuery, limit?: number) {
        const st = new Query();
        const locale = cloneTerms ? cloneTerms.locale : "";
        st.setPaging(1, limit);
        st.setLocale(locale);
        return st;
    }

    public static clone(st: IQuery): Query {
        const clonedSt = cloneDeep(st);
        const terms = new Query();
        return Object.assign(terms, clonedSt);
    }

    public static mimic(st: IQuery): Query {
        const terms = new Query();
        terms.setLocale(st.locale);
        terms.setUser(st.user);

        delete terms.id;
        delete terms.projection;

        terms.filters = {};
        terms.setPaging(1, -1);
        terms.options.populate = [];

        return terms;
    }

    public static handleFilter(key: string, value: any): IFilter {
        const filter: IFilter = {
            key: key,
            value: value,
            op: "$eq"
        };
        if (key.indexOf("&") === 0) {
            filter.key = key.substring(1);
            filter.op = "$eq";
        } else if (key.indexOf("!!") === 0) {
            filter.key = key.substring(2);
            filter.op = "$nin";
            const parts = (Array.isArray(value) ? value : value?.split("|")).map(val => ["null", "undefined"].includes(val) ? null : val);
            if (parts.length < 1) {
                return null;
            }
            filter.value = parts;
        }  else if (key.indexOf("!") === 0) {
            filter.key = key.substring(1);
            filter.op = "$ne";
        } else if (key.indexOf("||") === 0) {
            filter.key = key.substring(2);
            filter.op = "$in";
            const parts = (Array.isArray(value) ? value : value?.split("|")).map(val => ["null", "undefined"].includes(val) ? null : val);
            if (parts.length < 1) {
                return null;
            }
            filter.value = parts;
        } else if (key.indexOf("|") === 0) {
            filter.key = key.substring(1);
            filter.op = "$or";
        } else if (key.indexOf("%%%") === 0) {
            filter.key = key.substring(3);
            filter.op = "$regex";
            value = Query.escapeRegex(value.trim());
            filter.value = new RegExp(`.*${value}.*`, "i");
        } else if (key.indexOf("%%") === 0) {
            filter.key = key.substring(2);
            filter.op = "$regex";
            value = Query.escapeRegex(value.trim());
            filter.value = new RegExp(`(^|\\s)${value}.*`);
        } else if (key.indexOf("%") === 0) {
            filter.key = key.substring(1);
            filter.op = "$regex";
            value = Query.escapeRegex(value.trim());
            filter.value = new RegExp(`(^|\\s)${value}.*`, "i");
        } else if (key.indexOf(">>") === 0) {
            filter.key = key.substring(2);
            filter.op = "$gte";
        } else if (key.indexOf(">") === 0) {
            filter.key = key.substring(1);
            filter.op = "$gt";
        } else if (key.indexOf("<<") === 0) {
            filter.key = key.substring(2);
            filter.op = "$lte";
        } else if (key.indexOf("<") === 0) {
            filter.key = key.substring(1);
            filter.op = "$lt";
        } else if (key.indexOf("**") === 0) {
            filter.key = key.substring(2);
            filter.op = "$regex";
            value = Query.escapeRegex(value.trim());
            filter.value = value;
        } else if (key.indexOf("*") === 0) {
            filter.key = key.substring(1);
            filter.op = "$exists";
            filter.value = !!value;
        } else if (key.indexOf("))") === 0) {
            filter.key = key.substring(2);
            filter.op = "$nested";
            try {
                filter.value = typeof value === "string" && (/^[\[{]/).test(value) ? JSON.parse(value) : value;
            } catch (e) {
                filter.value = value;
            }
        } else if (key.indexOf(")") === 0) {
            filter.key = key.substring(1);
            filter.op = "$bool";
            filter.value = [];
            try {
                if (typeof value === "string" && (/^[\[{]/).test(value)) {
                    value = JSON.parse(value);
                }
                if (!Array.isArray(value)) {
                    value = [value];
                }
                for (let v of value) {
                    if (typeof v === "string" && (/^[\[{]/).test(v)) {
                        v = JSON.parse(v);
                    }
                    const secondTerms = new Query();
                    secondTerms.setFilters(v);
                    filter.value.push(secondTerms);
                }
            } catch (e) {
                Logger.exception(e, {source: "SearchTerms.handleFilter"});
                filter.value = value;
            }
        } else {
            return null;
        }
        return filter;
    }

    public static toRequest(terms: IQuery): IRequestTerms {
        const options: IRequestTerms = pick(terms.options, ["sort", "populate", "lean", "page", "limit"]);
        // TODO iggi figure out if the below is needed
        // if (terms.id) {
        //     options._id = terms.id;
        // }
        if (!options.limit) {
            options.limit = -1;
        }
        if (terms.index) {
            options.index = terms.index;
        }
        if (terms.debug) {
            options.debug = true;
        }
        if (terms.projection && Object.keys(terms.projection).length) {
            const fields: string[] = [];
            Object.keys(terms.projection).forEach(key => {
                fields.push(terms.projection[key] === 1 ? key : ("-" + key));
            });
            options.fields = fields.join(" ");
        }
        if (options.sort && typeof options.sort === "object") {
            let sort = "";
            let delim = "";
            Object.keys(options.sort).forEach(key => {
                const op = options.sort[key] > 0 ? "" : "-";
                sort += delim + op + key;
                delim = ",";
            });
            options.sort = sort;
        }
        return {
            ...terms.filters,
            ...options,
            lang: terms.locale
        };
    }

    public static escapeRegex(str: string): string {
        return escapeRegExp(str);
    }

    public static requestMeta(req: Request): IRequestMetadata {
        const ip = Helpers.requestIp(req);
        const userAgent: string = req.get("user-agent");
        const referrer: string = req.get("Referrer");
        const clientVersion: string = req.get("Client-Version");
        return {
            ip,
            userAgent,
            referrer,
            lang: req.getLocale(),
            clientVersion: parseInt(clientVersion, 10) || null
        };
    }

    public advancedFilters(toFilter = {}) {
        for (let key in toFilter) {
            if (!toFilter.hasOwnProperty(key)) {
                continue;
            }
            if (/^[\w$]/.test(key)) {
                this.pushFilter({
                    op: "$eq",
                    key: key,
                    value: toFilter[key]
                });
                continue;
            }
            const filter: IFilter = Query.handleFilter(key, toFilter[key] || "");
            if (!filter) {
                delete toFilter[key];
                continue;
            }
            this._setFilter(filter.key, filter.value, filter.op);
            delete toFilter[key];
        }
        return this;
    }
    /**
     * Pass a comma separated fields you want for projection
     */
    public select(fields: string = "") {
        const projection = {};
        let delimiter = ",";
        if (!/,/.test(fields)) {
            delimiter = " ";
        }

        fields.split(delimiter).map((field: string) => {
            field = field.trim();
            if (field.startsWith("-")) {
                field = field.replace("-", "");
                projection[field] = 0;
            } else {
                projection[field] = 1;
            }
        });
        this.projection = Object.keys(projection).length ? projection : null;
        this.projection = Query.fixProjection(this.projection);
        return this;
    }

    public addSelect(field: string = "", value: number = 1) {
        if (!field) {
            return;
        }
        if (!this.projection) {
            this.projection = {};
        }
        this.projection[field] = value;
        this.projection = Query.fixProjection(this.projection);
        return this;
    }

    /**
     * Required to upgrade to MongoDB >= 4.4
     */
    public static fixProjection(projection: object) {
        if (!projection) {
            return projection;
        }
        const aProjectionKeys = Object.keys(projection);
        for (const aKey of aProjectionKeys) {
            for (const bKey in projection) {
                const prefixed = bKey + ".";
                if (!projection.hasOwnProperty(bKey) || aKey === bKey) {
                    continue;
                }
                if (aKey.indexOf(prefixed) === 0) {
                    delete projection[bKey];
                    Logger.warning(`SearchTerms.fixProjection: ${bKey} is contained in ${aKey}`);
                    break;
                }
            }
        }
        return projection;
    }

    public checkPopulate(populate?: string|IPopulate[]) {
        if (!populate) {
            return this;
        }
        if (Array.isArray(populate)) {
            this.populate(populate);
            return this;
        }
        const pops = populate.split(",");
        if (pops.length) {
            this.populate(pops);
        }
        return this;
    }

    /**
     * ! Warning! Still experimental
     * @param pops
     * @protected
     */
    protected _mergePopulate(pops: IPopulate[]): IPopulate[] {
        const resultPops: IPopulate[] = [];
        const popByPath: Record<string, IPopulate> = {};
        pops.map(pop => {
            if (!popByPath[pop.path]) {
                popByPath[pop.path] = {
                    path: pop.path,
                    pathProp: pop.pathProp,

                    select: pop.select,
                    populate: [],

                    business: pop.business,
                    prop: pop.prop,
                    filters: pop.filters,
                    markForSkip: pop.markForSkip,
                    strictPopulate: !!pop.strictPopulate,
                    options: {
                        language: this.locale
                    }
                };
            }
            if (pop.populate?.length) {
                pop.populate = this._mergePopulate(pop.populate);
            }
            popByPath[pop.path].populate.push(pop);
        });
        Object.keys(popByPath).forEach(path => {
            const temp = popByPath[path];
            const finalPop: IPopulate = {
                path: path,
                pathProp: temp.pathProp,
                select: "",
                populate: [],
                business: temp.business,
                prop: temp.prop,
                filters: temp.filters,
                markForSkip: temp.markForSkip,
                strictPopulate: !!temp.strictPopulate,
                options: {
                    language: this.locale
                }
            };
            temp.populate.forEach(pop => {
                if (pop.business) {
                    finalPop.business = pop.business;
                }
                if (pop.select) {
                    const selectionMap: object = {};
                    (finalPop.select + " " + pop.select).trim().split(" ").forEach(s => {
                        selectionMap[s] = 1;
                    });
                    finalPop.select = Object.keys(Query.fixProjection(selectionMap)).join(" ");
                }
                if (pop.populate?.length) {
                    finalPop.populate.push(...pop.populate);
                }
            });
            finalPop.select = finalPop.select.trim();
            if (finalPop.populate.length) {
                finalPop.populate = this._mergePopulate(finalPop.populate);
            } else {
                delete finalPop.populate;
            }
            if (!finalPop.select) {
                delete finalPop.select;
            }
            if (!finalPop.pathProp) {
                delete finalPop.pathProp;
            }
            if (!finalPop.business) {
                delete finalPop.business;
            }
            if (!finalPop.prop) {
                delete finalPop.prop;
            }
            if (!finalPop.filters) {
                delete finalPop.filters;
            }
            if (!finalPop.markForSkip) {
                delete finalPop.markForSkip;
            }
            resultPops.push(finalPop);
        });
        return resultPops;
    }

    public populate(populates: IPopulate[] | string[] = []) {
        const resultPopulates: IPopulate[] = [];
        populates.forEach((pop: string | IPopulate) => {
            let populate: IPopulate = typeof pop === "string" ? {path: pop} : pop;
            if (this.projection && !this.projection[populate.path]) {
                const dotIndex = populate.path.indexOf(".");
                // if it is a base path then add it
                if (dotIndex === -1) {
                    this.projection[populate.path] = 1;
                } else {
                    // if it is a nested path then first check if the parent already exists
                    const baseKey = populate.path.substring(0, dotIndex);
                    if (!this.projection[baseKey]) {
                        this.projection[populate.path] = 1;
                    }
                }
            }
            resultPopulates.push(populate);
        });
        this.options.populate = this._mergePopulate(resultPopulates);
        this.projection = Query.fixProjection(this.projection);
        this._setRecursivePopulateLocale(this.options.populate);
        return this;
    }

    public addPopulate(populates: IPopulate[]) {
        const totalPopulates = this.options.populate;
        totalPopulates.push(...populates);
        return this.populate(totalPopulates);
    }

    public autopopulate(autopopulate: boolean = true) {
        this.options.autopopulate = !!autopopulate;
        return this;
    }

    public selectPopulate(populates: IPopulate[] = []) {
        this.options.populate = populates;
        return this;
    }

    public setSort(sort: string = "", options?: Partial<ISearchTermsSortOptions>) {
        if (!sort) {
            return this;
        }
        const sortResult: Record<string, number> = {};
        let sortParts = sort.split(",");
        sortParts.forEach(sortPart => {
            sortPart = sortPart.trim();

            // Check for sorting direction (1 = ASC, -1 = DESC)
            let sortDirection = 1;
            if (sortPart.indexOf("-") === 0) {
                sortPart = sortPart.substring(1);
                sortDirection = -1;
            } else if (sortPart.indexOf("+") === 0) {
                sortPart = sortPart.substring(1);
            }

            // Check if field is multi-lang
            if (options?.multiLangFields?.includes(sortPart)) {
                sortPart = sortPart + "." + this.locale;
            }
            sortResult[sortPart] = sortDirection;
        });
        this.options.sort = sortResult;
        return this;
    }

    public setId(id: string, index: string = "") {
        this.id = id;
        this.index = index;
        return this;
    }

    public setDebug(state: boolean) {
        this.debug = !!state;
        return this;
    }

    public setIndex(index: string = "") {
        this.index = index;
        return this;
    }

    public setSlices(slices: number) {
        this.slices = slices;
        return this;
    }

    public setScroll(scrollSeconds: number, scrollId?: string) {
        this.scroll = scrollSeconds;
        if (scrollId) {
            this.scrollId = scrollId;
        }
        return this;
    }

    public setUser(id: string) {
        this.user = id;
        return this;
    }

    public setToken(token: string): this;
    public setToken(req: Request): this;
    public setToken(reqOrToken: string|Request): this {
        if (typeof reqOrToken === "string" && reqOrToken) {
            this.token = reqOrToken;
        }
        if (typeof reqOrToken === "object" && reqOrToken.headers?.authorization) {
            const token = (reqOrToken.headers.authorization || "").replace("Bearer ", "");
            if (token) {
                this.token = token;
            }
        }
        return this;
    }

    /**
     * Adds 'Bearer' to the auth token and returns it
     */
    public authorization(): string {
        return `Bearer ${this.token}`;
    }

    public setOption(key: string, val: any) {
        this.options[key] = val;
        return this;
    }

    /**
     * Recursively checks for "true"|"false" or "$regex" and modifies them to boolean and RegExp respectively
     */
    protected _modifyFilter(filter: any, deep: boolean = false): any {
        if (filter === "true" || filter === "false") {
            return filter === "true";
        }
        if (Helpers.isNullOrUndefined(filter)) {
            return null;
        }
        if (
            typeof filter === "object" && Object.keys(filter).length <= 2
            && filter.hasOwnProperty("$regex")
            && typeof filter["$regex"] === "string"
        ) {
            const value = Query.escapeRegex(filter["$regex"].toString().trim());
            return new RegExp(value, typeof filter.$options === "string" ? filter.$options : "");
        }

        if (deep && typeof filter === "object" && Object.keys(filter).length > 0) {
            for (let key in filter) {
                filter[key] = this._modifyFilter(filter[key], deep);
            }
        }

        return filter;
    }

    protected _prepareFilters(key: string) {
        if (typeof this.filters[key] != "object") {
            this.filters[key] = {};
        }
        return this;
    }

    public setFilters(filters: any, setDeepFilters: boolean = false) {
        this.filters = {};
        if (filters.hasOwnProperty("~raw")) {
            delete filters["~raw"];
        } else {
            this.advancedFilters(filters);
        }
        for (let key in filters) {
            if (!filters.hasOwnProperty(key)) {
                continue;
            }
            filters[key] = this._modifyFilter(filters[key], setDeepFilters);
        }
        this.filters = {...this.filters, ...filters};
        return this;
    }

    protected _setFilter(key: string, val: any, op: IFilterOp = "$eq") {
        switch (op) {
            case "$eq":
                this.filters[key] = val;
                break;
            case "$elemMatch":
            case "$nested":
                this._prepareFilters(key);
                this.filters[key]["$elemMatch"] = typeof val === "string"
                    ? {$eq: val}
                    : Array.isArray(val)
                        ? {$in: val}
                        : val;
                break;
            case "$bool":
                if (!Array.isArray(val)) {
                    val = [val];
                }
                // key === not | and | or
                if (key !== "and" && key !== "not" && key !== "or") {
                    key = "or";
                }
                // Convert to Array
                if (!this.filters["$" + key] || !Array.isArray(this.filters["$" + key])) {
                    const res = [];
                    if (this.filters["$" + key]) {
                        res.push(this.filters["$" + key]);
                    }
                    this.filters["$" + key] = res;
                }
                for (let v of val) {
                    if (!v?.filters || !v?.options) {
                        continue;
                    }
                    for (let k in v.filters) {
                        if (!v.filters.hasOwnProperty(k)) {
                            continue;
                        }
                        this.filters["$" + key].push({
                            [k]: v.filters[k]
                        });
                    }
                }
                break;
            default:
                this._prepareFilters(key);
                this.filters[key][op] = val;
                break;

        }
        this.pushFilter({
            op: op,
            key: key,
            value: val
        });
        return this;
    }

    public setFilter(key: string, val: any, op: IFilterOp = "$eq") {
        if (/^[\w$]/.test(key)) {
            this._setFilter(key, val, op);
        } else {
            const filter = Query.handleFilter(key, val);
            if (filter) {
                this._setFilter(filter.key, filter.value, filter.op);
            }
        }
        return this;
    }

    public removeFilter(key: string, all: boolean = false) {
        delete this.filters[key];
        for (let i = 0; i < this.opFilters.length; ++i) {
            const f = this.opFilters[i];
            if (key === f.key) {
                this.opFilters.splice(i, 1);
                if (!all) {
                    break;
                }

            }
        }
        return this;
    }

    public pushFilter(filter: IFilter) {
        let replaced = false;
        for (let i = 0; i < this.opFilters.length; ++i) {
            const f = this.opFilters[i];
            if (filter.key === f.key && filter.op === f.op && filter.op !== "$bool") {
                this.opFilters[i] = filter;
                replaced = true;
                break;
            }
        }
        if (!replaced) {
            this.opFilters.push(filter);
        }
        return this;
    }

    public setLean(lean: boolean) {
        this.options.lean = lean;
        return this;
    }

    public setLocale(locale?: string, collation: boolean = false) {
        this.locale = locale || global.defaultLanguage;
        this.options.language = this.locale;
        if (collation) {
            this.options.collation = {locale: this.locale};
        } else {
            delete this.options.collation;
        }
        this._setRecursivePopulateLocale(this.options.populate);
        return this;
    }

    protected _setRecursivePopulateLocale(pops: IPopulate[]) {
        for (const pop of pops || []) {
            if (typeof pop !== "string") {
                pop.options = {
                    ...(pop.options || {}),
                    language: this.locale
                };
                if (pop.populate?.length) {
                    this._setRecursivePopulateLocale(pop.populate);
                }
            }
        }
    }

    public setPaging(page: number, limit?: number) {
        this.options.page = page || 1;
        this.options.limit = limit || global.pagingLimit;
        if (this.options.limit === -1) {
            delete this.options.limit;
        }
        return this;
    }

    public search(key: string, value: string, modifiers?: string) {
        value = Query.escapeRegex(value.trim());
        if (modifiers === "$text") {
            this.filters["$text"] = {
                $search: {
                    "$regex": new RegExp(`(^|\\s)${value}.*`)
                }
            };
        } else {
            this.filters[key] = {
                "$regex": new RegExp(`(^|\\s)${value}.*`)
            };
            if (modifiers) {
                this.filters[key].$options = modifiers;
            }
        }
        this.pushFilter({
            key: key,
            value: ".*" + value + ".*",
            op: "$regex"
        });
        return this;
    }

    public searchIn(fields: string[]): IQuery {
        if (!Helpers.isEmpty(this.filters.key) && fields.length) {
            const value = Query.escapeRegex(this.filters.key.trim());
            this.filters["$or"] = fields.map(v => ({
                [v]: {
                    $regex: new RegExp(`(^|\\s)${value}.*`),
                    $options: "i"
                }
            }));
            delete this.filters.key;
        } else {
            for (let key in this.filters) {
                if (!this.filters.hasOwnProperty(key)) {
                    continue;
                }
                for (let field of fields) {
                    if (field.indexOf(key) === 0) { // either exact match or start of multilang
                        if (field.length !== key.length) { // multiLang match
                            this.filters["$or"] = global.languages.map((lang) => {
                                const langVal = Query.escapeRegex(this.filters[key]);
                                return {
                                    [`${key}.${lang}`]: {
                                        $regex: `.*${langVal}.*`,
                                        $options: "i"
                                    }
                                };
                            });
                            delete this.filters[key];
                            break;
                        }
                    }
                }
            }
        }
        return this;
    }

    public setProjectionForPaginate() {
        this.setOption("projection", this.projection);
        return this;
    }

    public readFrom(pref: ReadPreference = ReadPreference.PRIMARY) {
        this.read = pref;
        return this;
    }
}
