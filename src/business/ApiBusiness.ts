import { Request } from "express";
import axios, { AxiosResponse, AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import { Business } from "./Business";
import { JsonResponse } from "../helpers/JsonResponse";
import { IRequestTerms, IQuery } from "../interfaces/helpers/Query";
import { Query } from "../helpers/Query";
import { Helpers } from "../helpers/Helpers";
import { IResponse } from "../interfaces/helpers/Response";

export class ApiBusiness<T = any> extends Business<T> {

    protected _request: AxiosInstance;
    protected _requestOptions: AxiosRequestConfig = {
        /*
        url: string;
        method: string;
        headers?: Record<string, string>; // {Authorization: this.authorization }
        params?: Record<string, string|number|boolean|any>;
        data?: any
        cancelToken?: this.cancelToken();
         */
        timeout: 60000,
        responseType: "json",
        decompress: true
    };

    /**
     * ! Override this
     */
    protected uri: string = "http://127.0.0.1:3000";
    protected _path: string = "";

    constructor() {
        super();
        this._request = axios.create(this._requestOptions);
    }

    public url(path: string = "/") {
        return `${this.uri}${this._path}${path}`;
    }

    public cancelToken() {
        return axios.CancelToken.source();
    }

    public filtersToRequest(terms: IQuery): IRequestTerms {
        return Query.toRequest(terms);
    }

    public addToken(token: string): this {
        super.addToken(token);
        this._request.defaults.headers.common.Authorization = this.authorization;
        return this;
    }

    public fromRequest(req?: Request): this {
        super.fromRequest(req);
        if (this.token) {
            // you can also do this with an interceptor
            this._request.defaults.headers.common.Authorization = this.authorization;
        }
        return this;
    }

    public initRequest(opts: AxiosRequestConfig = {}) {
        opts = {...this._requestOptions, ...opts};
        this._request = axios.create(opts);
        return this;
    }

    /**
     * Executes a request to the api.
     * ```
     * GET
     * {
     *    method: "GET",
     *    url: this.url("/"),
     *    params: {}
     * }
     *
     * POST
     * {
     *    method: "POST",
     *    url: this.url("/"),
     *    data: {}
     * }
     * ```
     * @param opts
     */
    public execRequest<T = any>(opts: AxiosRequestConfig): Promise<JsonResponse<T>> {
        return this._request(opts)
            .then((res: AxiosResponse<T|IResponse<T>>) => {
                if (res.data.hasOwnProperty("success") && typeof res.data["success"] === "boolean") {
                    return new JsonResponse<T>(<IResponse<T>>res.data);
                }
                return new JsonResponse<T>().ok(<T>res.data);
            })
            .catch((e: AxiosError<T|IResponse<T>>) => {
                if (e.response?.data?.hasOwnProperty("success") && typeof e.response.data["success"] === "boolean") {
                    return new JsonResponse<T>(<IResponse<T>>e.response.data);
                }
                if (e.name === "StatusCodeError" && e.code !== "500") {
                    this.warning(e.message, "execRequest", {url: e.request?.url});
                } else {
                    this.exception(Helpers.requestException(e), "execRequest", null, true);
                }
                return JsonResponse.caught<T>(e);
            });
    }
}
