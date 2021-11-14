import * as express from "express";
import * as path from "path";
import * as proxy from "express-http-proxy";
import { ProxyOptions } from "express-http-proxy";
import IRoute from "@interfaces/common/Route";
import IController from "@interfaces/controllers/base/Controller";
import Authenticator from "@helpers/Authenticator";
import { IPermissionsConfig, PermissionLevel } from "@interfaces/models/Permission";

export default class Route implements IRoute {

    name?: string;
    path: string;
    proxy?: string;
    proxyOptions?: ProxyOptions;

    routes?: IRoute[];

    verb?: "get"|"post"|"put"|"delete"|"patch"|"head"|"options"|"all";
    ctrl?: IController;
    method?: string;

    middlewares: express.RequestHandler[]|express.RequestHandler[][] = [];
    permissions: string[] = [];
    permission?: number;
    permissionsConfig?: IPermissionsConfig;

    constructor(route: IRoute) {
        Object.assign(this, route);
    }

    public pre(middlewares: express.RequestHandler[]|express.RequestHandler[][]) {
        this.middlewares = [].concat(middlewares).concat(this.middlewares);
        return this;
    }
    public post(middlewares: express.RequestHandler[]|express.RequestHandler[][]) {
        this.middlewares = [].concat(this.middlewares).concat(middlewares);
        return this;
    }

    public register (router: express.Router, parentPath: string = "") {
        let data = [];
        try {
            let actualPath = path.join(parentPath, this.path);
            if (this.ctrl && this.method) {
                if ("registry" in this.ctrl) {
                    const registry = this.ctrl.registry();
                    if (registry?.name && !global.businessRegistry.hasOwnProperty(registry.name)) {
                        global.businessRegistry[registry.name] = registry.business;
                    }
                }
                if (this.permission > PermissionLevel.NONE) {
                    // @ts-ignore
                    this.pre(Authenticator.allow({level: this.permission, model: this.permissionsConfig?.model || this.ctrl?.model}));
                } else {
                    this.pre([Authenticator.checkForUser()]);
                }
                data = [this.verb, actualPath, this.ctrl.constructor.name, this.method];
                router[this.verb](actualPath, ...this.middlewares, this.ctrl[this.method].bind(this.ctrl));
            } else if (this.routes && this.routes.length) {
                this.routes.forEach((_route: IRoute) => {
                    const route = new Route(_route);
                    if (this.middlewares.length) {
                        route.pre(this.middlewares);
                    }
                    route.register(router, actualPath);
                });
            } else if (this.proxy) {
                if (this.permission > PermissionLevel.NONE) {
                    // @ts-ignore
                    this.pre(Authenticator.allow({level: this.permission, model: this.permissionsConfig?.model || this.ctrl?.model}));
                }
                router.all(actualPath, ...this.middlewares, proxy(this.proxy, this.proxyOptions));
            }
        } catch (err) {
            Log.exception(err, {source: "Route.register"});
            Log.warning(data);
        }
    }

}
