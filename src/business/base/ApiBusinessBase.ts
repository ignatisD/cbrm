import ApiBusiness from "@business/base/ApiBusiness";
import IBusinessBase from "@interfaces/business/BusinessBase";
import { ISearchTerms } from "@interfaces/helpers/SearchTerms";
import JsonResponse from "@helpers/JsonResponse";
import { IMappingResponse } from "@interfaces/helpers/Mapping";
import IPaginatedResults from "@interfaces/helpers/PaginatedResults";
import { IBulkWriteOpResultObject } from "@interfaces/helpers/BulkWriteResponse";
import Pagination from "@helpers/Pagination";
import { MappingMode } from "@interfaces/models/base/EsModel";

export default class ApiBusinessBase<T = any> extends ApiBusiness implements IBusinessBase<T> {
    constructor() {
        super();
    }
    public async count(terms: ISearchTerms): Promise<number> {
        const options = {
            method: "get",
            uri: this.url("/count"),
            qs: {
                ...this.filtersToRequest(terms)
            }
        };
        const res = await this.execRequest<number>(options);
        return res.get() ?? null;
    }
    public async create(item: Partial<T>|any): Promise<JsonResponse<T>> {
        const options = {
            method: "post",
            uri: this.url("/create"),
            body: item
        };
        return await this.execRequest<T>(options);
    }
    public async createMany(items: Partial<T>[], refresh?: any): Promise<JsonResponse<T[]>> {
        const options = {
            method: "post",
            uri: this.url("/create-many"),
            body: items
        };
        return await this.execRequest<T[]>(options);
    }
    public async delete(id: string, params?: any): Promise<boolean> {
        const options = {
            method: "delete",
            uri: this.url("/delete/" + id)
        };
        const res = await this.execRequest<boolean>(options);
        return res.get() ?? false;
    }
    public async deleteMany(terms: ISearchTerms): Promise<number> {
        const options = {
            method: "post",
            uri: this.url("/delete"),
            qs: {
                ...this.filtersToRequest(terms)
            }
        };
        const res = await this.execRequest<number>(options);
        return res.get() ?? 0;
    }
    public async duplicate(terms: ISearchTerms): Promise<JsonResponse<T>> {
        const options = {
            method: "post",
            uri: this.url("/duplicate/" + terms.id),
            qs: {
                ...this.filtersToRequest(terms)
            }
        };
        return await this.execRequest<T>(options);
    }
    public async ensureMapping(mode: MappingMode = MappingMode.ALL): Promise<JsonResponse> {
        const options = {
            method: "put",
            uri: this.url("/mapping"),
            qs: {
                mode: mode
            }
        };
        return await this.execRequest(options);
    }
    public async find(terms: ISearchTerms): Promise<T[]> {
        const options = {
            method: "post",
            uri: this.url("/find"),
            body: {
                ...this.filtersToRequest(terms)
            }
        };
        const res = await this.execRequest<T[]>(options);
        return res.get() ?? [];
    }
    public async findById(terms: ISearchTerms): Promise<T> {
        const options = {
            method: "get",
            uri: this.url("/edit" + (terms.id ? "/" + terms.id : "")),
            qs: {
                ...this.filtersToRequest(terms)
            }
        };
        const res = await this.execRequest<T>(options);
        return res.get() ?? null;
    }
    public async findOne(terms: ISearchTerms): Promise<T> {
        if (terms.id) {
            return this.findById(terms);
        }
        const options = {
            method: "post",
            uri: this.url("/find-one"),
            body: {
                ...this.filtersToRequest(terms)
            }
        };
        const res = await this.execRequest<T>(options);
        return res.get() ?? null;
    }
    public async getMapping(modelOnly?: boolean): Promise<IMappingResponse> {
        const options = {
            method: "get",
            uri: this.url("/mapping"),
            qs: {
                modelOnly
            }
        };
        const res = await this.execRequest<IMappingResponse>(options);
        return res.get() ?? null;
    }
    public async restore(id: string): Promise<number> {
        const options = {
            method: "put",
            uri: this.url("/restore/" + id)
        };
        const res = await this.execRequest<number>(options);
        return res.get() ?? 0;
    }
    public async retrieve(terms: ISearchTerms): Promise<IPaginatedResults<T>> {
        const options = {
            method: "post",
            uri: this.url(),
            body: {
                ...this.filtersToRequest(terms)
            }
        };
        const res = await this.execRequest<IPaginatedResults<T>>(options);
        return res.get() ?? new Pagination();
    }
    public async search(terms: ISearchTerms) {
        const options = {
            method: "post",
            uri: this.url(),
            body: {
                ...this.filtersToRequest(terms)
            }
        };
        const res = await this.execRequest<IPaginatedResults<T>>(options);
        return res.get() ?? new Pagination();
    }
    public async update(id: string, props: Partial<T>|any): Promise<JsonResponse<T>> {
        const options = {
            method: "put",
            uri: this.url("/update/" + id),
            body: props
        };
        return await this.execRequest<T>(options);
    }
    public async updateMany(terms: ISearchTerms, props: Partial<T>|any): Promise<JsonResponse<number>> {
        const options = {
            method: "put",
            uri: this.url("/update-many"),
            body: props,
            qs: {
                ...this.filtersToRequest(terms)
            }
        };
        return await this.execRequest<number>(options);
    }
    public async updateManyWithDifferentValues(props: Partial<T[]>, refresh?: any): Promise<JsonResponse<IBulkWriteOpResultObject>> {
        const options = {
            method: "put",
            uri: this.url("/update-many-with-different-values"),
            body: props
        };
        return await this.execRequest<IBulkWriteOpResultObject>(options);
    }
    public async updateOrCreate(params: Partial<T>, props: any): Promise<JsonResponse> {
        return Promise.resolve(JsonResponse.notImplemented());
    }
    public async updateOrCreateMany(params: Partial<T>[], props: any): Promise<JsonResponse> {
        return Promise.resolve(JsonResponse.notImplemented());
    }
}
