import { AxiosRequestConfig } from "axios";
import { ApiBusiness } from "./ApiBusiness";
import { IBusinessBase } from "../interfaces/business/BusinessBase";
import { IQuery } from "../interfaces/helpers/Query";
import { JsonResponse } from "../helpers/JsonResponse";
import { IMappingResponse, MappingMode } from "../interfaces/helpers/Mapping";
import { IPaginatedResults } from "../interfaces/helpers/PaginatedResults";
import { Pagination } from "../helpers/Pagination";

export class ApiBusinessBase<T = any> extends ApiBusiness implements IBusinessBase<T> {
    constructor() {
        super();
    }

    public async count(terms: IQuery): Promise<number> {
        const options: AxiosRequestConfig = {
            method: "get",
            url: this.url("/count"),
            params: {
                ...this.filtersToRequest(terms)
            }
        };
        const res = await this.execRequest<number>(options);
        return res.get() ?? null;
    }

    public async create(item: Partial<T> | any): Promise<JsonResponse<T>> {
        const options: AxiosRequestConfig = {
            method: "post",
            url: this.url("/create"),
            data: item
        };
        return await this.execRequest<T>(options);
    }

    public async createMany(items: Partial<T>[], refresh?: any): Promise<JsonResponse<T[]>> {
        const options: AxiosRequestConfig = {
            method: "post",
            url: this.url("/create-many"),
            data: items
        };
        return await this.execRequest<T[]>(options);
    }

    public async delete(id: string, params?: any): Promise<boolean> {
        const options: AxiosRequestConfig = {
            method: "delete",
            url: this.url("/delete/" + id)
        };
        const res = await this.execRequest<boolean>(options);
        return res.get() ?? false;
    }

    public async deleteMany(terms: IQuery): Promise<number> {
        const options: AxiosRequestConfig = {
            method: "post",
            url: this.url("/delete"),
            params: {
                ...this.filtersToRequest(terms)
            }
        };
        const res = await this.execRequest<number>(options);
        return res.get() ?? 0;
    }

    public async duplicate(terms: IQuery): Promise<JsonResponse<T>> {
        const options: AxiosRequestConfig = {
            method: "post",
            url: this.url("/duplicate/" + terms.id),
            params: {
                ...this.filtersToRequest(terms)
            }
        };
        return await this.execRequest<T>(options);
    }

    public async ensureMapping(mode: MappingMode = MappingMode.ALL): Promise<JsonResponse> {
        const options: AxiosRequestConfig = {
            method: "put",
            url: this.url("/mapping"),
            params: {
                mode: mode
            }
        };
        return await this.execRequest(options);
    }

    public async find(terms: IQuery): Promise<T[]> {
        const options: AxiosRequestConfig = {
            method: "post",
            url: this.url("/find"),
            data: {
                ...this.filtersToRequest(terms)
            }
        };
        const res = await this.execRequest<T[]>(options);
        return res.get() ?? [];
    }

    public async findById(terms: IQuery): Promise<T> {
        const options: AxiosRequestConfig = {
            method: "get",
            url: this.url("/edit" + (terms.id ? "/" + terms.id : "")),
            params: {
                ...this.filtersToRequest(terms)
            }
        };
        const res = await this.execRequest<T>(options);
        return res.get() ?? null;
    }

    public async findOne(terms: IQuery): Promise<T> {
        if (terms.id) {
            return this.findById(terms);
        }
        const options: AxiosRequestConfig = {
            method: "post",
            url: this.url("/find-one"),
            data: {
                ...this.filtersToRequest(terms)
            }
        };
        const res = await this.execRequest<T>(options);
        return res.get() ?? null;
    }

    public async getMapping(modelOnly?: boolean): Promise<IMappingResponse> {
        const options: AxiosRequestConfig = {
            method: "get",
            url: this.url("/mapping"),
            params: {
                modelOnly
            }
        };
        const res = await this.execRequest<IMappingResponse>(options);
        return res.get() ?? null;
    }

    public async restore(id: string): Promise<number> {
        const options: AxiosRequestConfig = {
            method: "put",
            url: this.url("/restore/" + id)
        };
        const res = await this.execRequest<number>(options);
        return res.get() ?? 0;
    }

    public async retrieve(terms: IQuery): Promise<IPaginatedResults<T>> {
        const options: AxiosRequestConfig = {
            method: "post",
            url: this.url(),
            data: {
                ...this.filtersToRequest(terms)
            }
        };
        const res = await this.execRequest<IPaginatedResults<T>>(options);
        return res.get() ?? new Pagination();
    }

    public async search(terms: IQuery) {
        const options: AxiosRequestConfig = {
            method: "post",
            url: this.url(),
            data: {
                ...this.filtersToRequest(terms)
            }
        };
        const res = await this.execRequest<IPaginatedResults<T>>(options);
        return res.get() ?? new Pagination();
    }

    public async update(id: string, props: Partial<T> | any): Promise<JsonResponse<T>> {
        const options: AxiosRequestConfig = {
            method: "put",
            url: this.url("/update/" + id),
            data: props
        };
        return await this.execRequest<T>(options);
    }

    public async updateMany(terms: IQuery, props: Partial<T> | any): Promise<JsonResponse<number>> {
        const options: AxiosRequestConfig = {
            method: "put",
            url: this.url("/update-many"),
            data: props,
            params: {
                ...this.filtersToRequest(terms)
            }
        };
        return await this.execRequest<number>(options);
    }

    public async updateManyWithDifferentValues(props: Partial<T[]>, refresh?: any): Promise<JsonResponse> {
        const options: AxiosRequestConfig = {
            method: "put",
            url: this.url("/update-many-with-different-values"),
            data: props
        };
        return await this.execRequest(options);
    }

    public async updateOrCreate(params: Partial<T>, props: any): Promise<JsonResponse> {
        return Promise.resolve(JsonResponse.notImplemented());
    }

    public async updateOrCreateMany(params: Partial<T>[], props: any): Promise<JsonResponse> {
        return Promise.resolve(JsonResponse.notImplemented());
    }
}
