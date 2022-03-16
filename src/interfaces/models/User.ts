import { IRole } from "./Role";

export interface IUser {
    _id: string;
    sessionId?: string;

    firstName: string;
    lastName: string;

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

    roles?: IRole[];
    permissions?: string[];

    createdAt?: Date;
    updatedAt?: Date;

    // virtuals
    fullName?: string;
    permissionMap?: Record<string, number>;
}

export type PlainUser = Pick<IUser, "_id"|"sessionId"|"email"|"firstName"|"lastName"|"image"|"fullName"|"phone"|"mobile"|"permissions"|"permissionMap"|"roles">;

export type RedisUser = Pick<IUser, "_id"|"sessionId"|"email"|"firstName"|"lastName">;
