import IRoute from "../helpers/Route";

export default interface IAppRoutes {
    routes(): IRoute[];
}

export interface ISimpleRoute {
    name: string;
    path: string;
    permissions?: string[];
    routes?: ISimpleRoute[];
}
