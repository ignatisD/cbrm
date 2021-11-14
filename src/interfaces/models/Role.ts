/**
 * Made with <3 by C.R.U.D. at 28/5/2019
 */
import { IMultilangField } from "@interfaces/models/base/Language";
import { IPermission } from "@interfaces/models/Permission";


export interface IRole {
    _id?: string|any;
    name: string|IMultilangField;
    slug: string;
    superAccess: boolean;
    permissions: IPermission[];
    createdAt?: string|Date;
    updatedAt?: string|Date;
    // virtuals
    permissionMap?: {[key: string]: number};
}
