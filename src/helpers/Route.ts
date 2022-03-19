import * as express from "express";
import * as path from "path";
import * as proxy from "express-http-proxy";
import { ProxyOptions } from "express-http-proxy";
import { IRoute } from "../interfaces/helpers/Route";
import { IController } from "../interfaces/controllers/Controller";
import { IPermissionsConfig, PermissionLevel } from "../interfaces/models/Permission";
import { Authenticator } from "./Authenticator";
import { Logger } from "./Logger";
import { Registry } from "./Registry";
import { HttpVerb } from "./HttpVerb";

export class Route implements IRoute {

    name?: string;
    path: string;
    proxy?: string;
    proxyOptions?: ProxyOptions;

    routes?: IRoute[];

    verb?: HttpVerb;
    ctrl?: IController;
    method?: string;

    middlewares: express.RequestHandler[]|express.RequestHandler[][] = [];
    permissions: string[] = [];
    permission?: number;
    permissionsConfig?: IPermissionsConfig;

    authenticator: typeof Authenticator = null;

    constructor(route: IRoute, authenticator?: typeof Authenticator) {
        Object.assign(this, route);
        if (authenticator && !this.authenticator) {
            this.authenticator = authenticator;
        }
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
                if (typeof this.ctrl.registry === "function") {
                    const registry = this.ctrl.registry();
                    if (registry?.name && !Registry.has(registry.name)) {
                        Registry.set(registry.name, registry.business);
                    }
                }
                if (this.authenticator) {
                    if (this.permission > PermissionLevel.NONE) {
                        // @ts-ignore
                        this.pre(this.authenticator.allow({level: this.permission, model: this.permissionsConfig?.model || this.ctrl?.model}));
                    } else {
                        this.pre([this.authenticator.checkForUser()]);
                    }
                }
                data = [this.verb, actualPath, this.ctrl.constructor.name, this.method];
                router[this.verb](actualPath, ...this.middlewares, this.ctrl[this.method].bind(this.ctrl));
            } else if (this.routes && this.routes.length) {
                this.routes.forEach((_route: IRoute) => {
                    const route = new Route(_route, this.authenticator);
                    if (this.middlewares.length) {
                        route.pre(this.middlewares);
                    }
                    route.register(router, actualPath);
                });
            } else if (this.proxy) {
                if (this.authenticator && this.permission > PermissionLevel.NONE) {
                    // @ts-ignore
                    this.pre(this.authenticator.allow({level: this.permission, model: this.permissionsConfig?.model || this.ctrl?.model}));
                }
                router.all(actualPath, ...this.middlewares, proxy(this.proxy, this.proxyOptions));
            }
        } catch (err) {
            Logger.exception(err, {source: "Route.register"});
            Logger.warning(data);
        }
    }

}
