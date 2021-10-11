import { createHash } from "crypto";
import * as moment from "moment";
import { performance } from "perf_hooks";
import { Request, Application } from "express";
import { Types } from "mongoose";
import { uniq } from "lodash";
// Interfaces
import IBusinessBase from "@interfaces/business/BusinessBase";
import { IPopulate, ISearchTerms } from "@interfaces/helpers/SearchTerms";
// Helpers
import ResponseError from "@helpers/common/ResponseError";
import SearchTerms from "@helpers/SearchTerms";
import { Doc } from "@interfaces/models/base/ModelBase";
import { URL } from "url";
import { renderFile } from "pug";
import juice from "juice";

export default class Helpers {
    public static get userAgent(): string {
        return "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36";
    }
    public static get defaultKey(): string {
        return "data";
    }

    public static requestException(e: any) {
        delete e.options;
        delete e.error;
        delete e.cause;
        if (e.request) {
            e.request = {
                uri: e.request.uri || e.request.url
            };
        }
        if (e.response) {
            e.response = {
                body: e.response?.body
            };
        }
        return e;
    }

    public static requestIp(req: Request): string {
        let ip: string = <string>req.headers["x-real-ip"] || <string>req.headers["x-forwarded-for"];
        if (!ip) {
            ip = req.ip || "";
        }
        if (ip.substr(0, 7) === "::ffff:") {
            ip = ip.substr(7);
        }
        return ip;
    }

    public static multilangField (field: string): string[] {
        return global.languages.map(lng => `${field}.${lng}`);
    }

    public static isMongoId(_id: string): boolean {
        return Types.ObjectId.isValid(_id);
    }

    static elapsed(started: number): string {
        const milliseconds = moment.duration(performance.now() - started, "ms");
        return (Math.round(milliseconds.asSeconds() * 1000) / 1000).toString() + " sec";
    }

    public static isTrue(val: any): boolean {
        return val && val !== "0" && val !== "false";
    }

    public static isNullOrUndefined(val: any): boolean {
        return val === "null" || val === "undefined" || val === null || val === undefined;
    }

    public static isEmpty(input: any) {
        return (input === undefined || input === null || input === "");
    }

    public static ifEmpty(input: any, then: any = undefined) {
        return (input === undefined || input === null || input === "") ? then : input;
    }

    public static isEmptyObject(obj: any): boolean {
        return Object.keys(obj).length === 0;
    }

    public static hash(str: string, type: string = "md5"): string {
        return createHash(type)
            .update(str, "utf8")
            .digest("hex");
    }

    public static parseFloat(str: string, decimal: string = ","): number {
        if (decimal === ",") {
            return parseFloat((str || "").replace(".", "").replace(",", "."));
        }
        return parseFloat((str || "").replace(",", ""));
    }

    public static cleanStr(str: string): string {
        str = str || "";
        return str.replace("&nbsp;", " ").replace("&euro;", "").replace("<br />", " - ").replace(/\s+/g, " ").trim();
    }

    public static paramEncode(obj) {
        let query = "", name, value, fullSubName, subName, subValue, innerObj, i;

        for (name in obj) {
            if (!obj.hasOwnProperty(name)) {
                continue;
            }
            value = obj[name];

            if (value instanceof Array) {
                for (i = 0; i < value.length; ++i) {
                    subValue = value[i];
                    fullSubName = name + "[" + i + "]";
                    innerObj = {};
                    innerObj[fullSubName] = subValue;
                    query += Helpers.paramEncode(innerObj) + "&";
                }
            } else if (value instanceof Object) {
                for (subName in value) {
                    subValue = value[subName];
                    fullSubName = name + "[" + subName + "]";
                    innerObj = {};
                    innerObj[fullSubName] = subValue;
                    query += Helpers.paramEncode(innerObj) + "&";
                }
            } else if (value !== undefined && value !== null)
                query += encodeURIComponent(name) + "=" + encodeURIComponent(value) + "&";
        }

        return query.length ? query.substr(0, query.length - 1) : query;
    }

    public static json(obj: any): string {
        return JSON.stringify(obj, null, 2);
    }

    /**
     * Javascript equivalent for PHP's preg_match_all
     *
     * The callback function takes arguments that have to do with the capture groups
     * - cb(fullMatch[, capture1, ...])
     *
     * The regex should have the global and multiline modifiers (gm)
     * - /regex/gm
     */
    public static pregMatchAll(regEx: RegExp, str: string, cb: any) {
        return str.replace(regEx, cb);
    }

    public static ucWords(str: string) {
        return (str + "").replace(/^([a-z])|\s+([a-z])/g, function ($1) {
            return $1.toUpperCase();
        });
    }

    public static propertyOrElse<O, P extends keyof O>(root: O, property: P, orElse?: O[P]): O[P] {
        return !root ? orElse : root[property] || orElse;
    }

    public static toHoursMinutes(d: Date) {
        return moment(d).format("H[h] m[m] s[s]");
    }

    public static getMoment(date: string, time?: string) {
        if (!time) {
            return moment(`${date}`, "YYYY-MM-DD");
        }
        return moment(`${date} ${time}`, "YYYY-MM-DD HH:mm:ss");
    }

    public static calculateDiff(previous: moment.Moment, next: moment.Moment) {
        return next.diff(previous, "minutes");
    }

    public static formatDuration(minutes: string | number) {
        let duration = moment.duration(minutes, "m");
        let days = duration.days();
        let hours = duration.hours();
        let result = duration.minutes().toString() + "m";
        if (hours > 0 && days > 0) {
            result = days.toString() + "d " + result;
            result = hours.toString() + "h " + result;
        } else if (hours > 0) {
            result = hours.toString() + "h " + result;
        } else if (days > 0) {
            result = days.toString() + "d " + result;
            result = hours.toString() + "h " + result;
        }
        return result;
    }

    public static getMinutes(hours: number, minutes: number) {
        let duration = moment.duration({minutes: minutes, hours: hours});
        return Helpers.formatDuration(duration.hours() * 60 + duration.minutes());
    }

    public static hoursToMinutes(hours) {
        let minutes = moment.duration(hours, "h").asMinutes();
        return Math.round(minutes);
    }

    public static moneyFormat(amount: number, decimals: number = 2): number {
        return parseFloat(amount.toFixed(decimals));
    }

    public static toArray<T>(objOrArray: T | T[], safeCheck = false): T[] {
        if (!objOrArray) {
            return [];
        }
        if (Array.isArray(objOrArray)) {
            return objOrArray;
        } else if (safeCheck && Object.keys(objOrArray).length === 0) {
            return [];
        }
        return [objOrArray];
    }

    public static requestDetails(req: Request): { ip: string, userAgent: string } {
        let ip: string = req.ip;
        if (ip.substr(0, 7) === "::ffff:") {
            ip = ip.substr(7);
        }
        return {
            ip: ip,
            userAgent: req.get("user-agent"),
        };
    }


    public static renderPugTemplate(path: string, data: any = {}, inlineCss: boolean = true) {
        let rendered = renderFile(path, data);
        if (inlineCss) {
            rendered = juice(rendered, {applyStyleTags: true, applyAttributesTableElements: true, applyWidthAttributes: true, preserveImportant: true});
        }
        return rendered;
    }

    public static renderHTML(app: Application) {
        return function () {
            let renderedHtml = "";
            // @ts-ignore
            app.render(...arguments, (err, html) => {
                renderedHtml = err ? "error in rendering" : html;
            });
            return renderedHtml;
        };
    }

    public static toObjectId(_id: any) {
        try {
            if (!_id) {
                return _id;
            }
            if (_id instanceof Types.ObjectId) {
                return _id;
            }
            return Types.ObjectId.createFromHexString(_id);
        } catch (e) {
            Log.error("toObjectId: ", _id);
            Log.exception(e);
            return _id;
        }
    }

    public static isObjectId(_id: string): boolean {
        try {
            if (Types.ObjectId.isValid(_id)) {
                return new Types.ObjectId(_id).toHexString() === _id;
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }
    }
    public static htmlspecialchars_decode(string, quoteStyle?) {
        let optTemp = 0;
        let i = 0;
        let noquotes = false;

        if (typeof quoteStyle === "undefined") {
            quoteStyle = 2;
        }
        string = string.toString()
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">");
        const OPTS = {
            "ENT_NOQUOTES": 0,
            "ENT_HTML_QUOTE_SINGLE": 1,
            "ENT_HTML_QUOTE_DOUBLE": 2,
            "ENT_COMPAT": 2,
            "ENT_QUOTES": 3,
            "ENT_IGNORE": 4
        };
        if (quoteStyle === 0) {
            noquotes = true;
        }
        if (typeof quoteStyle !== "number") {
            // Allow for a single string or an array of string flags
            quoteStyle = [].concat(quoteStyle);
            for (i = 0; i < quoteStyle.length; i++) {
                // Resolve string input to bitwise e.g. "PATHINFO_EXTENSION" becomes 4
                if (OPTS[quoteStyle[i]] === 0) {
                    noquotes = true;
                } else if (OPTS[quoteStyle[i]]) {
                    optTemp = optTemp | OPTS[quoteStyle[i]];
                }
            }
            quoteStyle = optTemp;
        }
        if (quoteStyle & OPTS.ENT_HTML_QUOTE_SINGLE) {
            // PHP doesn"t currently escape if more than one 0, but it should:
            string = string.replace(/&#0*39;/g, "'");
            // This would also be useful here, but not a part of PHP:
            // string = string.replace(/&apos;|&#x0*27;/g, "'");
        }
        if (!noquotes) {
            string = string.replace(/&quot;/g, "'");
        }
        // Put this in last place to avoid escape being double-decoded
        string = string.replace(/&amp;/g, "&");

        return string;
    }

    /**
     * @description Takes an object, and a property path and returns the value of that property or undefined
     * if property wasn't found
     * @param {string[]|string} p       - The tokenized path of the value to be set. Can contain arrays like: array.2.property
     * @param {any} obj             - The target object or array to be modified
     * @param step                  - The number of loops to start from (Used for recursion, leave empty)
     * @return  The value of the property or undefined
     */
    public static getNestedFieldValue(p: string[]|string, obj: any, step: number = 0) {
        const path = Array.isArray(p) ? p : p.split(".");
        if (step === 0 && path.length === 1) {
            return obj[path[0]];
        }

        let toSend;

        if (path[step].includes("[")) {
            let parts: any = path[step].split("[");
            let key = parts[0];
            let index = parts[1];

            index = parseInt(index.substring(0, index.length - 1), 2);

            if (obj[key][index]) {
                toSend = obj[key][index];
            }

            if (!toSend) {
                return undefined;
            }
        } else {
            try {
                if (!this.isEmptyObject(obj) && obj[path[step]]) {
                    toSend = obj[path[step]];
                } else {
                    toSend = undefined;
                }
            } catch (e) {
                toSend = undefined;
            }
        }

        if (step < path.length - 1) {
            // Recursion
            return this.getNestedFieldValue(path, toSend, ++step);
        } else {
            if (!toSend) {
                return undefined;
            }
            return toSend;
        }
    }

    /**
     * @description Takes an object, sets the specified property and returns new object, identical to obj other than the set property
     * @param {string} pathString   - The path of the value to be set. Can contain arrays like: array.2.property
     * @param {any} obj             - The target object or array to be modified
     * @param setValue              - The value to be set
     * @param step                  - The number of loops to start from (Used for recursion, leave empty)
     * @param deleteValue           - Whether to delete the property at the specified path
     * @return  A copy of obj with the specified field set to setValue (if found)
     */
    public static setNestedFieldValue(pathString: string, obj: any, setValue: any, step: number = 0, deleteValue: boolean = false) {
        const path = pathString.split(".");
        if (step === path.length - 1 && obj[path[step]] !== undefined) {
            if (!deleteValue) {
                obj[path[step]] = setValue;
            } else {
                delete obj[path[step]];
            }
            return obj;
        }

        if (path[step].includes("[")) {
            let parts: any = path[step].split("[");
            let key = parts[0];
            let index = parts[1];

            index = parseInt(index.substring(0, index.length - 1), 2);

            if (obj[key][index] !== undefined) {
                obj[key][index] = Helpers.setNestedFieldValue(path.join("."), obj[key][index], setValue, ++step, deleteValue);
            }
        } else {
            try {
                if (!Helpers.isEmptyObject(obj) && obj[path[step]] !== undefined) {
                    obj[path[step]] = Helpers.setNestedFieldValue(path.join("."), obj[path[step]], setValue, ++step, deleteValue);
                }
            } catch (e) {
                return obj;
            }
        }
        return obj;
    }

    public static getOneLevelNestedProperties(pathProp, doc): any|any[] {
        let property;
        if (!/\.\$\./.test(pathProp)) {
            return Helpers.getNestedFieldValue(pathProp, doc);
        }
        let properties: any[] = [];
        // array detected;
        const nested = pathProp.split(".$.");
        const levelOne: any[] = Helpers.getNestedFieldValue(nested[0], doc);
        if (!levelOne || !Array.isArray(levelOne) || !nested[1]) {
            return properties;
        }
        levelOne.forEach(subDoc => {
            property = Helpers.getNestedFieldValue(nested[1], subDoc);
            properties.push(...(Array.isArray(property) ? property : [property]));
        });
        return properties;
    }

    public static setOneLevelNestedProperties(path, doc, value, pathProp, isArray: boolean = false) {
        if (!/\.\$\./.test(path)) {
            const values = Object.values(value);
            Helpers.setNestedFieldValue(path, doc, (isArray ? values : values[0]));
            return;
        }
        const nestedPath = pathProp.split(".$.");
        const nested = path.split(".$.");
        const levelOne: any[] = Helpers.getNestedFieldValue(nested[0], doc);
        if (!levelOne || !Array.isArray(levelOne) || !nested[1] || !nestedPath[1]) {
            return;
        }
        levelOne.forEach(subDoc => {
            let property = Helpers.getNestedFieldValue(nestedPath[1], subDoc);
            let toSet: any = {
                [nested[1]]: property
            };
            if (Array.isArray(property)) {
                toSet = [];
                property.forEach((p) => {
                    if (value[p]) {
                        toSet.push(value[p]);
                    }
                });
            } else {
                if (value[property]) {
                    toSet = value[property];
                }
            }
            Helpers.setNestedFieldValue(nested[1], subDoc, toSet);
        });
    }

    public static async populate<T>(docs: T[], st: ISearchTerms): Promise<T[]>;
    public static async populate<T>(docs: T, st: ISearchTerms): Promise<T>;
    public static async populate<T>(docs: T[] | T, st: ISearchTerms) {
        let onlyOne = false;
        if (!Array.isArray(docs)) {
            docs = [docs];
            onlyOne = true;
        }
        const populates = <IPopulate[]>(SearchTerms.fromScratch().populate(st?.options?.populate || []).options.populate);
        if (!docs || !docs.length || !populates?.length) {
            return onlyOne ? docs[0] : docs;
        }
        const maps: Record<string, Record<string, any>> = {};
        populates.forEach((pop: IPopulate) => {
            if (!pop.business) {
                throw new ResponseError("BusinessNotDefined", "No business defined for this level of IPopulate", [pop]);
            }
            const tmpSelect = (pop.select || "").trim();
            const select = [];
            (tmpSelect.includes(",") ? tmpSelect.split(",") : tmpSelect.split(" ")).forEach(s => {
                if (s) {
                    select.push(s);
                }
            });
            if (!maps[pop.business]) {
                maps[pop.business] = {
                    business: pop.business,
                    ids: {},
                    docs: {},
                    populate: {},
                    filters: pop.filters,
                    select: select,
                    prop: pop.prop || "_id",
                    path: pop.path,
                    pathProp: pop.pathProp || pop.path
                };
            } else {
                if (pop.path === maps[pop.business].path) {
                    pop.markForSkip = true;
                }
            }
            if (select?.length) {
                maps[pop.business].select.push(...select);
            }
            if (pop.populate?.length) {
                if (!maps[pop.business].populate[pop.path]) {
                    maps[pop.business].populate[pop.path] = pop.populate;
                } else {
                    maps[pop.business].populate[pop.path].push(...pop.populate);
                }
            }
        });
        docs.forEach((doc) => {
            populates.forEach((pop) => {
                if (pop.markForSkip) {
                    return;
                }
                const pathProp = pop.pathProp || pop.path;
                const property = Helpers.getOneLevelNestedProperties(pathProp, doc);
                if (Array.isArray(property)) {
                    property.forEach((p) => {
                        maps[pop.business].ids[p] = 1;
                    });
                } else if (property) {
                    maps[pop.business].ids[property] = 1;
                }
            });
        });
        for (let modelBusiness in maps) {
            if (!maps.hasOwnProperty(modelBusiness)) {
                continue;
            }
            const business: any = global.businessRegistry[modelBusiness];
            if (!business) {
                throw new ResponseError("BusinessNotFound", modelBusiness + " not registered");
            }
            const deepPopulates: IPopulate[] = [];
            Object.values(maps[modelBusiness].populate).forEach((popArray: IPopulate[]) => {
                if (!popArray.length) {
                    return;
                }
                popArray.forEach((p) => deepPopulates.push(p));
            });
            const deepPopulate = !!deepPopulates.length;
            const terms = SearchTerms.mimic(st)
            .setPaging(1, -1)
            .setFilter(maps[modelBusiness].prop, Object.keys(maps[modelBusiness].ids));
            if (maps[modelBusiness].filters) {
                for (let f in maps[modelBusiness].filters) {
                    if (maps[modelBusiness].filters.hasOwnProperty(f)) {
                        terms.setFilter(f, maps[modelBusiness].filters[f]);
                    }
                }
            }
            if (st.options.lean) {
                terms.setLean(true);
            }
            if (maps[modelBusiness].select?.length) {
                if (maps[modelBusiness].prop && !maps[modelBusiness].select.includes(maps[modelBusiness].prop)) {
                    maps[modelBusiness].select.push(maps[modelBusiness].prop);
                }
                const select = uniq(maps[modelBusiness].select).join(" ");
                terms.select(select);
            }
            if (deepPopulate) {
                terms.checkPopulate(deepPopulates);
            }
            const businessInstance: IBusinessBase = new business();
            if (st.token) {
                businessInstance.addToken(st.token);
            }
            const results: any[] = await businessInstance.find(terms);
            results.forEach((result: any) => {
                const key = Helpers.getNestedFieldValue(maps[modelBusiness].prop, result);
                maps[modelBusiness].docs[key] = result;
            });
        }
        docs.forEach((doc) => {
            populates.forEach((pop) => {
                if (pop.markForSkip) {
                    return;
                }
                const pathProp = pop.pathProp || pop.path;
                let value: Record<string, any> = {};
                let isArray = false;
                const property = Helpers.getOneLevelNestedProperties(pathProp, doc);
                if (Array.isArray(property)) {
                    isArray = true;
                    property.forEach((p) => {
                        if (maps[pop.business].docs[p]) {
                            value[p] = maps[pop.business].docs[p];
                        } else {
                            value[p] = p;
                        }
                    });
                } else if (property) {
                    if (maps[pop.business].docs[property]) {
                        value[property] = maps[pop.business].docs[property];
                    } else {
                        value[property] = property;
                    }
                }
                if (!value || Helpers.isEmptyObject(value)) {
                    return;
                }
                Helpers.setOneLevelNestedProperties(pop.path, doc, value, pathProp, isArray);
            });
        });
        return onlyOne ? docs[0] : docs;
    }

    public static makeFlat(obj: any, nested: string = ""): Record<string, any> {
        const result: Record<string, any> = {};
        if (nested) {
            nested += ".";
        }
        if (!obj) {
            return null;
        }
        Object.keys(obj).forEach((key) => {
            if (typeof obj[key] === "string" || typeof obj[key] === "number" || typeof obj[key] === "boolean" || typeof obj[key] === "bigint") {
                result[nested + key] = obj[key];
                return;
            }
            if (Helpers.isObjectId(obj[key]) || (typeof obj[key] === "object" && obj[key]?._bsontype === "ObjectID")) {
                result[nested + key] = obj[key].toString();
                return;
            }
            if (Array.isArray(obj[key])) {
                if (Helpers.isObjectId(obj[key]?.[0]) || (typeof obj[key]?.[0] === "object" && obj[key]?.[0]?._bsontype === "ObjectID")) {
                    result[nested + key] = obj[key].map(k => k.toString());
                    return;
                }
                obj[key].forEach((item) => {
                    if (typeof item === "string" || typeof item === "number" || typeof item === "boolean" || typeof item === "bigint") {
                        result[nested + key] = item;
                        return;
                    }
                    const flat = this.makeFlat(item, nested + key);
                    if (!flat) {
                        return;
                    }
                    Object.keys(flat).forEach(f => {
                        if (Array.isArray(flat[f])) {
                            if (result[f] == undefined) {
                                result[f] = [];
                            } else if (!Array.isArray(result[f])) {
                                const p = result[f];
                                result[f] = [p];
                            }
                            result[f].push(flat[f]);
                        } else {
                            if (result[f] == undefined) {
                                result[f] = flat[f];
                            } else if (Array.isArray(result[f])) {
                                result[f].push(flat[f]);
                            } else {
                                const p = result[f];
                                result[f] = [p, flat[f]];
                            }
                        }
                    });
                });
                return;
            }
            const flat = this.makeFlat(obj[key], nested + key);
            if (!flat) {
                return;
            }
            Object.keys(flat).forEach(f => {
                if (Array.isArray(flat[f])) {
                    if (result[f] == undefined) {
                        result[f] = [];
                    } else if (!Array.isArray(result[f])) {
                        const p = result[f];
                        result[f] = [p];
                    }
                    result[f].push(flat[f]);
                } else {
                    if (result[f] == undefined) {
                        result[f] = flat[f];
                    } else if (Array.isArray(result[f])) {
                        result[f].push(flat[f]);
                    } else {
                        const p = result[f];
                        result[f] = [p, flat[f]];
                    }
                }
            });
        });
        return result;
    }

    public static getLangByReferer(url: string) {
        try {
            const pathname = new URL(url).pathname;
            const pattern = new RegExp("^\/(" + global.languages.join("|") + ")\/");
            const languageResults = pattern.exec(pathname);
            if (languageResults && global.languages.includes(languageResults[1])) {
                return languageResults[1];
            } else {
                return null;
            }
        } catch (e) {
            return null;
        }
    }

    public static toObject<T>(item: Doc<T>): T {
        return item?.toObject ? item.toObject<T>() : item;
    }
}
