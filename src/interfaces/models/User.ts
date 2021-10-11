import { IPermission, IRole } from "@interfaces/models/Role";

export default interface IUser {
    _id: string;
    firstName: string;
    lastName: string;
    fullName?: string;
    email: string;
    password?: string;
    passwordResetToken?: string;
    passwordResetExpires?: Date;

    changePassword?: boolean;
    activated?: boolean;

    provider?: {
        google?: string,
        facebook?: string
    };

    permissions?: string[];
    permissionsNew?: Record<string, number>;
    roles?: IRole[];
    image?: string;
    createdAt?: Date;
    updatedAt?: Date;

    plain?(): IUserPlain;

    comparePassword?(password: string): boolean;

    plain?(): IUserPlain;

    isSuperUser?(): boolean;

    hasAccess?(permissions: string[], role: IRole, operation?: string): boolean;

}

export interface IUserPlain {
    _id: string;
    sessionId?: string;
    email: string;
    gravatar?: string;
    fullName?: string;
    firstName: string;
    lastName: string;
    phone: string;
    permissions: IPermission[];
    roles: string[];
}

export interface ISimpleUser {
    email: string;
    firstName?: string;
    lastName?: string;
    password: string;
}

export interface IRedisUser {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    sessionId?: string;
}
