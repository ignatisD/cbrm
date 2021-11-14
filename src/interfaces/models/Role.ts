/**
 * Made with <3 by C.R.U.D. at 28/5/2019
 */
import { IMultilingual } from "../helpers/Multilingual";
import { IPermission } from "./Permission";


export interface IRole {
    _id?: string|any;
    name: string|IMultilingual;
    slug: string;
    superAccess: boolean;
    permissions: IPermission[];
    createdAt?: string|Date;
    updatedAt?: string|Date;
    // virtuals
    permissionMap?: {[key: string]: number};
}
