import { Request, Response, Router } from "express";
import * as path from "path";
import IBaseRoutes, { ISimpleRoute } from "@interfaces/routes/BaseRoutes";
import IRoute from "@interfaces/common/Route";
import JsonResponse from "@helpers/JsonResponse";
import Route from "@routes/base/Route";
import { PermissionLevel } from "@interfaces/models/Role";
import IController from "@interfaces/controllers/base/Controller";
import CommonBusiness from "@business/CommonBusiness";
import { IBusinessRegistry } from "@interfaces/business/BusinessLike";
import CommonRoutes from "@routes/CommonRoutes";

// Routes

export default class BaseRoutes implements IBaseRoutes, IController<CommonBusiness> {

    public routes(): IRoute[] {
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
                permission: PermissionLevel.VIEW,
                permissionsConfig: {
                    model: "Route"
                }
            },
            {
                name: "Common Routes",
                path: "/common",
                routes: new CommonRoutes().routes()
            }
            // DO NOT REPLACE OR REMOVE THE BELOW COMMENT!!!!!
            // CRUD

            // CRUD
            // DO NOT REPLACE OR REMOVE THE ABOVE COMMENT!!!!!
        ];
    }

    public register() {
        // Welcome
        const router = Router();

        // external route template
        this.routes().forEach((_route: IRoute) => {
            const route = new Route(_route);
            route.register(router);
        });

        // catch 404
        router.use((req: Request, res: Response) => {
            res.status(404).json(new JsonResponse().error(`Not Found ${req.path}`));
        });

        return router;
    }

    public registry(): IBusinessRegistry<CommonBusiness> {
        return {
            name: "CommonBusiness",
            business: CommonBusiness
        };
    }

    public getRoutes(req: Request, res: Response) {
        let routes: ISimpleRoute[] = BaseRoutes.getRouting(this.routes());
        return res.json(new JsonResponse().ok(routes, "routes"));
    }

    public static getRouting(_routes: IRoute[], parentPath: string = ""): ISimpleRoute[] {
        let routes: ISimpleRoute[] = [];
        _routes.forEach((_route: IRoute) => {
            if (!_route.name) {
                return;
            }
            let route: ISimpleRoute = {
                name: _route.name,
                path: path.join(parentPath, _route.path),
                permissions: _route.permissions
            };
            if (_route.routes && _route.routes.length) {
                route.routes = BaseRoutes.getRouting(_route.routes, route.path);
            }
            routes.push(route);
        });
        return routes;
    }

    index(req: Request, res: Response): void {
        try {
            res.json(new JsonResponse().ok({
                title: "Hello world!",
                mode: process.env.NODE_ENV,
                host: process.env.HOSTNAME,
                build: process.env.BUILD,
                pm2: process.env.NODE_APP_INSTANCE
            }));
        } catch (e) {
            res.status(500).json(new JsonResponse().exception(e));
        }
    }
}
