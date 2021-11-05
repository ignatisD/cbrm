import { Request } from "express";
import axios, { AxiosResponse, AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import Business from "@business/base/Business";
import JsonResponse from "@helpers/JsonResponse";
import { ISearchTerms } from "@interfaces/helpers/SearchTerms";
import SearchTerms from "@helpers/SearchTerms";
import Helpers from "@helpers/Helpers";
import IResponse from "@interfaces/helpers/base/Response";

export default class ApiBusiness<T = any> extends Business<T> {

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

    public filtersToRequest(terms: ISearchTerms): any {
        return SearchTerms.toRequest(terms);
    }

    public addToken(token: string): this {
        super.addToken(token);
        this.initRequest({...this._requestOptions, headers: {Authorization: this.authorization }});
        return this;
    }

    public fromRequest(req?: Request): this {
        super.fromRequest(req);
        if (this.token) {
            // you can also do this with an interceptor
            this.initRequest({...this._requestOptions, headers: {Authorization: this.authorization }});
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
     *    uri: this.url("/"),
     *    qs: {}
     * }
     *
     * POST
     * {
     *    method: "POST",
     *    uri: this.url("/"),
     *    body: {}
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
                    Log.warning(e.message, e.request?.url, this.businessUser);
                } else {
                    Log.exception(Helpers.requestException(e), this.businessUser, true);
                }
                return JsonResponse.caught<T>(e);
            });
    }
}
