import { Request } from "express";
import * as requestP from "request-promise";
import { Response } from "request";
import Business from "@business/base/Business";
import JsonResponse from "@helpers/JsonResponse";
import { ISearchTerms } from "@interfaces/helpers/SearchTerms";
import SearchTerms from "@helpers/SearchTerms";
import Helpers from "@helpers/Helpers";

export default class ApiBusiness extends Business<any> {

    protected _request: requestP.RequestPromiseAPI;
    protected _requestOptions: requestP.RequestPromiseOptions = {
        /*
        uri: string;
        method: string;
        headers?: Record<string, string>; // {Authorization: this.authorization }
        qs?: Record<string, string|number|boolean|any>;
        body?: any
         */
        timeout: 60000,
        resolveWithFullResponse: true,
        json: true,
        gzip: true
    };

    /**
     * ! Override this
     */
    protected uri: string = "http://127.0.0.1:3000";
    protected _path: string = "";

    constructor() {
        super();
        this._request = requestP.defaults(this._requestOptions);
    }

    public url(path: string = "/") {
        return `${this.uri}${this._path}${path}`;
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
            this.initRequest({...this._requestOptions, headers: {Authorization: this.authorization }});
        }
        return this;
    }

    public initRequest(opts: requestP.RequestPromiseOptions = {}) {
        opts = {...this._requestOptions, ...opts};
        this._request = requestP.defaults(opts);
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
    public execRequest<T = any>(opts: requestP.Options): Promise<JsonResponse<T>> {
        return this._request(opts)
            .then((res: Response) => {
                return new JsonResponse<T>(res.body);
            })
            .catch((e) => {
                if (e.response?.body && e.response?.body.hasOwnProperty("success")) {
                    return new JsonResponse<T>(e.response.body);
                }
                if (e.name === "StatusCodeError" && e.statusCode !== 500) {
                    Log.warning(e.message, e.request?.uri, this.businessUser);
                } else {
                    Log.exception(Helpers.requestException(e), this.businessUser, true);
                }
                return JsonResponse.caught<T>(e);
            });
    }
}
