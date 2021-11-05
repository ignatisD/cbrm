/**
 * Made with <3 by C.R.U.D. at 28/5/2019
 */
import { IMultilangField } from "@interfaces/models/base/Language";


export interface IRole {
    _id?: string|any;
    name: string|IMultilangField;
    slug: string;
    permissions: IPermission[];
    permissionMap: {[key: string]: number};
    superAccess: boolean;
    createdAt?: string|Date;
    updatedAt?: string|Date;
}

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
