import { IRole } from "@interfaces/models/Role";

export default interface IUser {
    _id: string;
    sessionId?: string;

    firstName: string;
    lastName: string;
    fullName?: string;

    email: string;
    phone?: string;
    mobile?: string;
    image?: string;

    password?: string;
    changePassword?: boolean;
    passwordResetToken?: string;
    passwordResetExpires?: Date;


    activated?: boolean;
    activationToken?: string;
    activationExpires?: Date;

    google?: string;
    facebook?: string;

    permissions?: string[];
    permissionMap?: Record<string, number>;
    roles?: IRole[];

    createdAt?: Date;
    updatedAt?: Date;

    plain?(): PlainUser;

    comparePassword?(password: string): boolean;

    isSuperUser?(): boolean;

    hasAccess?(permissions: string[], role: IRole, operation?: string): boolean;

}

export type PlainUser = Pick<IUser, "_id"|"sessionId"|"email"|"firstName"|"lastName"|"image"|"fullName"|"phone"|"mobile"|"permissions"|"roles">;

export type RedisUser = Pick<IUser, "_id"|"sessionId"|"email"|"firstName"|"lastName">;