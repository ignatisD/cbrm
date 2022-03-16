import { flatten, get, pick, reduce, set, uniq } from "lodash";
import { IRepository } from "../interfaces/repository/Repository";
import { IModel } from "../interfaces/models/Model";
import { IUser } from "../interfaces/models/User";
import { IPopulate, IQuery } from "../interfaces/helpers/Query";
import { Query } from "../helpers/Query";
import { Logger } from "../helpers/Logger";
import { IBusinessLike } from "../interfaces/business/BusinessLike";
import { Registry } from "../helpers/Registry";

export abstract class Repository<T extends IModel> implements IRepository {

    protected _user: Partial<IUser>;
    protected _modelName: string;
    protected readonly _model: T;
    protected _id: string = "_id";

    protected constructor(model: T) {
        this._model = model;
        this._modelName = this.model?.modelName || this.model?.className || "Unknown";
    }

    public get model(): T {
        return this._model;
    }

    public get modelName() {
        return this._modelName;
    }

    public addUser(user: Partial<IUser>) {
        this._user = user;
        return this;
    }

    public get repoUser() {
        return {
            repository: this.constructor?.name,
            user: pick(this._user, ["_id", "fullName", "firstName", "lastName", "email"])
        };
    }

    public emptyPaginatedResults(docs: any[] = []) {
        return {docs: docs, limit: -1, total: docs.length, page: 1, pages: 1, offset: 0, hasNextPage: false, hasPrevPage: false, pagingCounter: 1};
    }

    /**
     * Ensure the result is a string and not an object/pointer/etc
     */
    protected __getPropertyAsString(property: any, pointer?: string) {
        let result: any = property;
        if (typeof property !== "string") {
            if (typeof property === "object" && property.objectId) {
                result = property.objectId;
            } else if (typeof property === "object" && property.id) {
                result = property.id;
            } else if (typeof property === "object" && typeof property.toString === "function") {
                result = property.toString();
            } else {
                result = (property || "").toString();
            }
        }
        if (pointer && result.indexOf(pointer) !== -1) {
            return result.split(`${pointer}\$`)[1];
        }
        return result;
    }
    /**
     * Safely navigate the doc and get the property
     * @param {object} doc
     * @param {string} prop
     * @return {null|*[]|undefined|*}
     * @private
     */
    protected _getPropertySafely(doc: any, prop: string = "") {
        if (prop.indexOf(".$.") !== -1) {
            // magic
            const parts = prop.split(".$.");
            return reduce(parts, (accum, part) => {
                return flatten(accum.map(one => {
                    if (!one) {
                        return undefined;
                    }
                    if (typeof one.get === "function") {
                        return one.get(part);
                    }
                    return get(one, part);
                }));
            }, [doc]);

        }
        if (typeof doc.get === "function") {
            if (prop === "objectId" || prop === "id") {
                return doc.id || doc.objectId;
            }
            const parts = prop.split(".");
            if (parts.length === 1) {
                return doc.get(prop);
            }
            const intermediate = doc.get(parts[0]);
            if (!intermediate) {
                return undefined;
            }
            parts.shift();
            return get(intermediate, parts.join("."));
        }
        return get(doc, prop);
    }
    /**
     Safely navigate the doc and set the property
     * @param {object} doc
     * @param {string} prop
     * @param {*} value
     * @private
     */
    protected _setPropertySafely(doc: any, prop: string, value: any) {
        if (prop.indexOf(".$.") !== -1) {
            // magic
            const parts: string[] = prop.split(".$.");
            const targetIndex: number = parts.length - 1;
            reduce(parts, (accum, part, index) => {
                return flatten(accum.map((one, innerIndex) => {
                    if (!one) {
                        return undefined;
                    }
                    if (targetIndex === index) {
                        if (typeof one.set === "function") {
                            one.set(part, value[innerIndex]);
                            return undefined;
                        }
                        set(one, part, value[innerIndex]);
                        return undefined;
                    }
                    if (typeof one.get === "function") {
                        return one.get(part);
                    }
                    return get(one, part);
                }));
            }, [doc]);
            return;
        }
        if (typeof doc.set === "function") {
            const parts = prop.split(".");
            if (parts.length === 1) {
                doc.set(prop, value);
            } else {
                const intermediate = doc.get(parts[0]);
                parts.shift();
                if (typeof intermediate.set === "function") {
                    intermediate.set(parts.join("."), value);
                } else {
                    set(intermediate, parts.join("."), value);
                }
            }
            return;
        }
        set(doc, prop, value);
    }

    public async populate<T>(docs: T[], st: IQuery): Promise<T[]>;
    public async populate<T>(docs: T, st: IQuery): Promise<T>;
    public async populate<T>(docs: T[] | T, st: IQuery) {
        let onlyOne = false;
        if (!Array.isArray(docs)) {
            docs = [docs];
            onlyOne = true;
        }
        const populates = <IPopulate[]>(Query.fromScratch().populate(st?.options?.populate || []).options.populate);
        if (!docs || !docs.length || !populates?.length) {
            return onlyOne ? docs[0] : docs;
        }
        const maps: Record<string, Record<string, any>> = {};
        populates.forEach((pop: IPopulate) => {
            if (!pop.business) {
                // Will be handled internally
                pop.markForSkip = true;
                return;
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
                    multiple: pop.multiple || undefined,
                    select: select,
                    prop: pop.prop || this._id || "_id",
                    path: pop.path,
                    pathProp: pop.pathProp || pop.path,
                    pointer: pop.pointer || false
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
                let property = this._getPropertySafely(doc, pathProp);
                if (property && Array.isArray(property)) {
                    property.forEach((p) => {
                        p = this.__getPropertyAsString(p);
                        if (p) {
                            maps[pop.business].ids[p] = 1;
                        }
                    });
                } else if (property) {
                    property = this.__getPropertyAsString(property);
                    if (property) {
                        maps[pop.business].ids[property] = 1;
                    }
                }
            });
        });
        for (const businessName in maps) {
            if (!maps.hasOwnProperty(businessName)) {
                continue;
            }
            const business = Registry.get(businessName);
            if (!business) {
                Logger.warning(businessName + " not registered");
                continue;
            }
            const deepPopulates: IPopulate[] = [];
            Object.values(maps[businessName].populate).forEach((popArray: IPopulate[]) => {
                if (!popArray.length) {
                    return;
                }
                popArray.forEach((p) => deepPopulates.push(p));
            });
            const deepPopulate = !!deepPopulates.length;
            const terms = Query.mimic(st)
                .setPaging(1, -1)
                .setFilter(maps[businessName].prop, Object.keys(maps[businessName].ids));
            if (maps[businessName].filters) {
                for (let f in maps[businessName].filters) {
                    if (maps[businessName].filters.hasOwnProperty(f)) {
                        terms.setFilter(f, maps[businessName].filters[f]);
                    }
                }
            }
            if (st.options.lean) {
                terms.setLean(true);
            }
            if (maps[businessName].select?.length) {
                if (maps[businessName].prop && !maps[businessName].select.includes(maps[businessName].prop)) {
                    maps[businessName].select.push(maps[businessName].prop);
                }
                const select = uniq(maps[businessName].select).join(" ");
                terms.select(select);
            }
            if (deepPopulate) {
                terms.checkPopulate(deepPopulates);
            }
            const businessInstance: IBusinessLike = new business();
            if (st.token) {
                businessInstance.addToken(st.token);
            }
            if (st.user) {
                businessInstance.addUser({[this._id || "_id"]: st.user});
            }
            const results: any[] = await businessInstance.find(terms);
            results.forEach((result: any) => {
                if (terms.options?.lean&& typeof result.toJSON === "function") {
                    result = result.toJSON();
                }
                const key = this.__getPropertyAsString(this._getPropertySafely(result, maps[businessName].prop), maps[businessName].pointer);
                if (maps[businessName].multiple) {
                    if (!maps[businessName].docs[key]) {
                        maps[businessName].docs[key] = [];
                    }
                    maps[businessName].docs[key].push(result);
                } else {
                    if (!maps[businessName].docs[key]) {
                        maps[businessName].docs[key] = result;
                    }
                }
            });
        }
        docs.forEach((doc) => {
            populates.forEach((pop) => {
                if (pop.markForSkip) {
                    return;
                }
                const pathProp = pop.pathProp || pop.path;
                let property = this._getPropertySafely(doc, pathProp);
                if (!property) {
                    return;
                }
                if (Array.isArray(property)) {
                    const value = [];
                    property.forEach((p, index) => {
                        p = this.__getPropertyAsString(p, pop.pointer);
                        if (maps[pop.business].docs[p]) {
                            value[index] = maps[pop.business].docs[p];
                        } else {
                            value[index] = pop.pathProp ? null : p;
                        }
                    });
                    this._setPropertySafely(doc, pop.path, value);
                } else {
                    property = this.__getPropertyAsString(property, pop.pointer);
                    if (maps[pop.business].docs[property]) {
                        this._setPropertySafely(doc, pop.path, maps[pop.business].docs[property]);
                    }
                }
            });
        });
        return onlyOne ? docs[0] : docs;
    }
}
