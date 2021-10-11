import IRoute from "@interfaces/common/Route";

export default interface IBaseRoutes {
    routes(): IRoute[];
}

export interface ISimpleRoute {
    name: string;
    path: string;
    permissions?: string[];
    routes?: ISimpleRoute[];
}
