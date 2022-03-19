import * as moment from "moment";
import juice from "juice";
import { createHash } from "crypto";
import { performance } from "perf_hooks";
import { Request, Application } from "express";
import { URL } from "url";
import { renderFile } from "pug";
import { Doc } from "../interfaces/models/Document";
import { Configuration } from "./Configuration";

export class Helpers {

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
        return Configuration.get("languages", []).map(lng => `${field}.${lng}`);
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

    public static toArray<T>(objOrArray: T | T[]): T[] {
        if (!objOrArray) {
            return [];
        }
        if (Array.isArray(objOrArray)) {
            return objOrArray;
        }
        return [objOrArray];
    }

    public static requestDetails(req: Request): { ip: string; userAgent: string } {
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

    static isDefined(val: any) {
        return ![undefined, null].includes(val);
    }

    static isSpecialObject(val: any) {
        if (!Helpers.isDefined(val)) {
            return false;
        }
        if (typeof val === "object") {
            return val.__type === "Pointer" && Helpers.isTrue(val.className) && Helpers.isTrue(val.objectId);
        }
        return typeof val === "object" && typeof val.toHexString === "function";
    }

    static specialObjectToString(val: any) {
        if (typeof val === "object" && typeof val.toHexString === "function") {
            return val.toHexString();
        }
        if (typeof val === "object" && val.__type === "Pointer" && Helpers.isTrue(val.className) && Helpers.isTrue(val.objectId)) {
            return `${val.className}$${val.objectId}`;
        }
        return (val || "").toString();
    }

    static isPrimitive(item: any) {
        return typeof item === "string"
            || typeof item === "number"
            || typeof item === "boolean"
            || typeof item === "bigint";
    }

    static mergeObjects(result: Record<string, any>, flat: Record<string, any>) {
        Object.keys(flat).forEach(f => {
            if (Array.isArray(flat[f])) {
                if (result[f] === undefined) {
                    result[f] = [];
                } else if (!Array.isArray(result[f])) {
                    const p = result[f];
                    result[f] = [p];
                }
                result[f].push(...flat[f]);
            } else {
                if (result[f] === undefined) {
                    result[f] = flat[f];
                } else if (Array.isArray(result[f])) {
                    result[f].push(flat[f]);
                } else {
                    const p = result[f];
                    result[f] = [p, flat[f]];
                }
            }
        });
    }

    static makeFlat(obj: any, nested: string = "") {
        const result: Record<string, any> = {};
        if (nested) {
            nested += ".";
        }
        if (!obj) {
            return null;
        }
        Object.keys(obj).forEach((key) => {
            if (this.isPrimitive(obj[key]) || this.isSpecialObject(obj[key]) || obj[key] instanceof Date) {
                if (obj[key] instanceof Date) {
                    result[nested + key] = obj[key].toString();
                } else if (typeof obj[key] === "object") {
                    result[nested + key] = this.specialObjectToString(obj[key]);
                } else {
                    result[nested + key] = obj[key];
                }
                return;
            }
            if (Array.isArray(obj[key])) {
                obj[key].forEach((item) => {
                    if (this.isPrimitive(item) || this.isSpecialObject(item)) {
                        if (result[nested + key] === undefined) {
                            result[nested + key] = [];
                        }
                        if (item instanceof Date) {
                            result[nested + key].push(item.toString());
                        } else if (typeof item === "object") {
                            result[nested + key].push(this.specialObjectToString(item));
                        } else {
                            result[nested + key].push(item);
                        }
                        return;
                    }
                    const flat = this.makeFlat(item, nested + key);
                    if (!flat) {
                        return;
                    }
                    this.mergeObjects(result, flat);
                });
                return;
            }
            const flat = this.makeFlat(obj[key], nested + key);
            if (!flat) {
                return;
            }
            this.mergeObjects(result, flat);
        });
        return result;
    }

    public static getLangByReferer(url: string) {
        try {
            const pathname = new URL(url).pathname;
            const pattern = new RegExp("^\/(" + Configuration.get("languages", []).join("|") + ")\/");
            const languageResults = pattern.exec(pathname);
            if (languageResults && Configuration.get("languages", []).includes(languageResults[1])) {
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
