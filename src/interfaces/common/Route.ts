import * as express from "express";
import IController from "@interfaces/controllers/base/Controller";
import { IPermission, IPermissionsConfig } from "@interfaces/models/Permission";

export default interface IRoute {
    name?: string;
    path: string;

    routes?: IRoute[];

    verb?: "get"|"post"|"put"|"delete"|"patch"|"head"|"options"|"all";
    ctrl?: IController;
    method?: string;

    middlewares?: (express.RequestHandler|express.RequestHandler[])[];
    permissions?: (string|any|Partial<IPermission>)[];
    permission?: string|number;
    permissionsConfig?: IPermissionsConfig;
    register?(router: express.Router): void;
}


export interface IExtraRoute extends IRoute {
    overwrite?: string;
}

