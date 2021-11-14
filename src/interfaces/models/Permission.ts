
export interface IPermission {
    name?: string;
    permId: string;
    targetModel?: string;
    route?: boolean;
}

export interface IPermissionsConfig {
    operation?: "OR" | "AND";
    model?: string;
}

export enum PermissionLevel {
    INHERIT = -1, // for users (null is treated as inherit for user)
    NONE = 0,
    VIEW = 1,
    UPDATE = 2,
    DELETE = 4
}
