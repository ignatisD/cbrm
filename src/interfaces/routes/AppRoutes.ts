import { IRoute } from "../helpers/Route";

export interface IAppRoutes {
    routes(): IRoute[];
}

export interface ISimpleRoute {
    name: string;
    path: string;
    permissions?: string[];
    routes?: ISimpleRoute[];
}
