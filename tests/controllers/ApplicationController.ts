import * as path from "path";
import { Request, Response } from "express";
import { Options } from "nodemailer/lib/mailer";
import * as cbrm from "../../src";
import { ApplicationBusiness } from "../business/ApplicationBusiness";
import { Logger } from "../../src";

export class ApplicationController extends cbrm.Controller<ApplicationBusiness> implements cbrm.IAppRoutes {

    constructor() {
        super(ApplicationBusiness);
    }

    public routes(): cbrm.IRoute[] {
        return [
            {
                name: "Api Index",
                path: "/",
                method: "index",
                verb: "get",
                ctrl: this
            },
            {
                name: "Routes",
                path: "/_routes",
                verb: "get",
                method: "getRoutes",
                ctrl: this,
                permission: cbrm.PermissionLevel.VIEW,
                permissionsConfig: {
                    model: "Route"
                }
            },
            {
                name: "Test email",
                path: "/email",
                verb: "get",
                method: "testEmail",
                ctrl: this
            },
            {
                name: "Test Queues",
                path: "/queue",
                verb: "get",
                method: "testQueues",
                ctrl: this
            },
            // DO NOT REPLACE OR REMOVE THE BELOW COMMENT!!!!!
            // CRUD

            // CRUD
            // DO NOT REPLACE OR REMOVE THE ABOVE COMMENT!!!!!
        ];
    }

    public getRoutes(req: Request, res: Response) {
        let routes: cbrm.ISimpleRoute[] = ApplicationController.getRouting(this.routes());
        return res.json(new cbrm.JsonResponse().ok(routes, "routes"));
    }

    public static getRouting(_routes: cbrm.IRoute[], parentPath: string = ""): cbrm.ISimpleRoute[] {
        let routes: cbrm.ISimpleRoute[] = [];
        _routes.forEach((_route: cbrm.IRoute) => {
            if (!_route.name) {
                return;
            }
            let route: cbrm.ISimpleRoute = {
                name: _route.name,
                path: path.join(parentPath, _route.path),
                permissions: _route.permissions
            };
            if (_route.routes && _route.routes.length) {
                route.routes = ApplicationController.getRouting(_route.routes, route.path);
            }
            routes.push(route);
        });
        return routes;
    }

    index(req: Request, res: Response): void {
        try {
            res.json(new cbrm.JsonResponse().ok({
                title: "Hello world!",
                mode: process.env.NODE_ENV,
                host: process.env.HOSTNAME,
                build: process.env.BUILD,
                pm2: process.env.NODE_APP_INSTANCE
            }));
        } catch (e) {
            res.status(500).json(new cbrm.JsonResponse().exception(e));
        }
    }

    async testQueues(req: Request, res: Response) {
        try {
            const emailOptions: Options = {
                from: cbrm.Configuration.get("appEmail"),
                to: "example@example.com",
                subject: "Test email from Queue",
                html: "<h1>Hello Queue!</h1>"
            };
            const response = await this.business(req).testQueues(emailOptions);
            res.json(response);
        } catch (e) {
            res.status(500).json(new cbrm.JsonResponse().exception(e));
        }
    }

    async testEmail(req: Request, res: Response) {
        try {
            const emailOptions: Options = {
                from: cbrm.Configuration.get("appEmail"),
                to: "ignatios@drakoulas.gr",
                subject: "Test email",
                html: "<h1>Hello World!</h1>"
            };
            const response = await this.business(req).notifyEmail(emailOptions);
            res.json(response);
        } catch (e) {
            this.exception(req, e, "testEmail");
            res.status(500).json(new cbrm.JsonResponse().exception(e));
        }
    }
}
