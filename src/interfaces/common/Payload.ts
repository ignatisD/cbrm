import IError from "@interfaces/common/Error";

export interface IPayload {
    sessionId: string;
    refresh?: boolean;
}

export interface ITokenResponse {
    token?: string;
    user?: any;
    refreshToken?: string;
    message?: string;
    error?: IError;
}

export interface ITokenDurations {
    tokenDuration: string;
    refreshTokenDuration: string;
    ttl: number;
}