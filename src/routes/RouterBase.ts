import IRoute, { IExtraRoute } from "../interfaces/helpers/Route";
import IAppRoutes from "../interfaces/routes/AppRoutes";
import IValidatorBase from "../interfaces/validators/ValidatorBase";
import IControllerBase from "../interfaces/controllers/ControllerBase";
import { PermissionLevel } from "../interfaces/models/Permission";

type DefaultRoutes =
    "index"
    | "create"
    | "createMany"
    | "edit"
    | "update"
    | "updateManyWithDifferentValues"
    | "updateMany"
    | "duplicate"
    | "delete"
    | "deleteMany"
    | "deleteManyById"
    | "restore"
    | "mapping"
    | "ensureMapping"
    | "count";

// TODO Update this to match the backend's
export default class RouterBase implements IAppRoutes {
    protected readonly name: string = "Base";
    protected readonly ctrl: IControllerBase;
    protected validator: IValidatorBase = null;
    protected readonly allowed = {
        "index": true,
        "create": true,
        "createMany": true,
        "edit": true,
        "find": true,
        "findOne": true,
        "update": true,
        "updateManyWithDifferentValues": true,
        "updateMany": true,
        "duplicate": true,
        "delete": true,
        "deleteMany": true,
        "deleteManyById": true,
        "restore": false,
        "mapping": true,
        "ensureMapping": true,
        "count": true
    };
    protected _extraRoutes: IExtraRoute[] = [];

    constructor(name: string, ctrl: IControllerBase) {
        this.name = name;
        this.ctrl = ctrl;
    }

    protected _exclude(exclude: DefaultRoutes[] = [], restore: boolean = false) {
        exclude.forEach((key) => {
            this.allowed[key] = false;
        });
        this.allowed.restore = !!restore;
    }

    protected _validator(validator: IValidatorBase) {
        this.validator = validator;
    }

    protected get index(): IRoute {
        return {
            name: this.name + " index",
            path: "/",
            verb: "all",
            ctrl: this.ctrl,
            method: "retrieve",
            permission: PermissionLevel.VIEW
        };
    }

    protected get find(): IRoute {
        return {
            name: this.name + " find",
            path: "/find",
            verb: "all",
            ctrl: this.ctrl,
            method: "find",
            permission: PermissionLevel.VIEW
        };
    }

    protected get create(): IRoute {
        return {
            name: this.name + " create",
            path: "/create",
            verb: "post",
            ctrl: this.ctrl,
            method: "create",
            permission: PermissionLevel.UPDATE
        };
    }

    protected get createMany(): IRoute {
        return {
            name: this.name + " create many",
            path: "/create-many",
            verb: "post",
            ctrl: this.ctrl,
            method: "createMany",
            permission: PermissionLevel.UPDATE
        };
    }

    protected get edit(): IRoute {
        return {
            name: this.name + " edit",
            path: "/edit/:_id?",
            verb: "get",
            ctrl: this.ctrl,
            method: "findOne",
            permission: PermissionLevel.VIEW
        };
    }

    protected get findOne(): IRoute {
        return {
            name: this.name + " findOne",
            path: "/findOne",
            verb: "all",
            ctrl: this.ctrl,
            method: "findOne",
            permission: PermissionLevel.VIEW
        };
    }

    protected get update(): IRoute {
        return {
            name: this.name + " update",
            path: "/update/:_id",
            verb: "put",
            ctrl: this.ctrl,
            method: "update",
            permission: PermissionLevel.UPDATE,
            permissions: []
        };
    }

    protected get updateMany(): IRoute {
        return {
            name: this.name + " update many",
            path: "/update-many",
            verb: "put",
            ctrl: this.ctrl,
            method: "updateMany",
            permission: PermissionLevel.UPDATE,
            permissions: []
        };
    }

    protected get delete(): IRoute {
        return {
            name: this.name + " delete",
            path: "/delete/:_id",
            verb: "delete",
            ctrl: this.ctrl,
            method: "delete",
            permission: PermissionLevel.DELETE,
            permissions: []
        };
    }

    protected get deleteMany(): IRoute {
        return {
            name: this.name + " delete by query",
            path: "/delete",
            verb: "post",
            ctrl: this.ctrl,
            method: "deleteMany",
            permission: PermissionLevel.DELETE,
            permissions: []
        };
    }

    protected get deleteManyById(): IRoute {
        return {
            name: this.name + " delete many",
            path: "/delete-many",
            verb: "delete",
            ctrl: this.ctrl,
            method: "deleteManyById",
            permission: PermissionLevel.DELETE,
            permissions: []
        };
    }

    protected get duplicate(): IRoute {
        return {
            name: this.name + " duplicate",
            path: "/duplicate/:_id",
            verb: "post",
            ctrl: this.ctrl,
            method: "duplicate",
            permission: PermissionLevel.UPDATE,
            permissions: []
        };
    }

    protected get restore(): IRoute {
        return {
            name: this.name + " restore",
            path: "/restore/:_id",
            verb: "put",
            ctrl: this.ctrl,
            method: "restore",
            permission: PermissionLevel.UPDATE
        };
    }

    protected get count(): IRoute {
        return {
            name: this.name + " count",
            path: "/count",
            verb: "get",
            ctrl: this.ctrl,
            method: "count",
            permission: PermissionLevel.VIEW
        };
    }

    protected get updateManyWithDifferentValues(): IRoute {
        return {
            name: this.name + " update many with different values",
            path: "/update-many-with-different-values",
            verb: "put",
            ctrl: this.ctrl,
            method: "updateManyWithDifferentValues",
            permission: PermissionLevel.UPDATE
        };
    }

    protected get mapping(): IRoute {
        return {
            name: this.name + " mapping",
            path: "/mapping",
            verb: "get",
            ctrl: this.ctrl,
            method: "mapping"
        };
    }

    protected get ensureMapping(): IRoute {
        return {
            name: this.name + " ensure mapping",
            path: "/mapping",
            verb: "put",
            ctrl: this.ctrl,
            method: "ensureMapping",
            permission: PermissionLevel.DELETE
        };
    }

    protected _makeRoute(route: IRoute) {
        if (this.validator && route.method in this.validator) {
            if (!route.middlewares) {
                route.middlewares = [];
            }
            route.middlewares = route.middlewares.concat(this.validator[route.method]);
        }
        return route;
    }

    public routes(): IRoute[] {
        const routes = [];
        for (let key in this.allowed) {
            if (this.allowed.hasOwnProperty(key)
                && this.allowed[key]
                && this[key]
                && !this._extraRoutes.find(route => route.overwrite === key)) {

                routes.push(this._makeRoute(this[key]));
            }
        }
        return routes.concat(this._extraRoutes.map(route => {
            delete route.overwrite;
            return route;
        }));
    }
}
