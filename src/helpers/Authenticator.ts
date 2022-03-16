import * as express from "express";
import * as moment from "moment";
import * as passport from "passport";
import * as passportJwt from "passport-jwt";
import * as PassportFB from "passport-facebook-token";
import * as PassportGoogle from "passport-google-token";
import * as jwt from "jsonwebtoken";
import * as uuid from "uuid";
// Interfaces
import { IBusinessBase } from "../interfaces/business/BusinessBase";
import { IUser, RedisUser } from "../interfaces/models/User";
import { IPayload, ITokenDurations, ITokenResponse } from "../interfaces/helpers/Payload";
// Helpers
import { Redis } from "./Redis";
import { ResponseError } from "./ResponseError";
import { JsonResponse } from "./JsonResponse";
import { Logger } from "./Logger";

export enum AuthError {
    TokenError = "TokenError",
    SessionError = "SessionError",
    UserNotFoundError = "UserNotFoundError",
    AlreadyExistsError = "AlreadyExistsError",
    PasswordMismatchError = "PasswordMismatchError",
    UnknownProvider = "UnknownProvider",
    UserOrPassError = "UserOrPassError",
    UserInvalid = "UserInvalid",
}

export class Authenticator {

    protected readonly secret: string;
    public static UserBusiness: IBusinessBase<IUser>;

    constructor(secret: string) {
        this.secret = secret;
        Authenticator.fbOptions.clientID = process.env.FACEBOOK_ID;
        Authenticator.fbOptions.clientSecret = process.env.FACEBOOK_SECRET;
        Authenticator.googleOptions.clientID = process.env.GOOGLE_ID;
        Authenticator.googleOptions.clientSecret = process.env.GOOGLE_SECRET;
    }

    public static passport: passport.Authenticator;
    public static jwtOptions: passportJwt.StrategyOptions = {
        jwtFromRequest: passportJwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: ""
    };
    public static fbOptions: any = {
        clientID: "FACEBOOK_ID",
        clientSecret: "FACEBOOK_SECRET"
    };
    public static googleOptions: any = {
        clientID: "GOOGLE_ID",
        clientSecret: "GOOGLE_SECRET"
    };

    public initialize() {
        if (!Authenticator.passport) {
            Authenticator.passport = passport;
        }
        Authenticator.jwtOptions.secretOrKey = this.secret;

        // JWT + Passport
        const strategy: passport.Strategy = new passportJwt.Strategy(Authenticator.jwtOptions, async (payload: IPayload, done: passportJwt.VerifiedCallback) => {
            if (!payload || !payload.sessionId || payload.refresh) { // you can't authenticate with a refresh token
                done(null);
                return;
            }
            const response = await Authenticator.userExists(payload.sessionId);
            done(response.reason(), response.get());
        });
        Authenticator.passport.use(strategy);

        const fbStrategy: PassportFB.StrategyInstance = new PassportFB(Authenticator.fbOptions,
            async (accessToken: string, refreshToken: string, profile: PassportFB.Profile, done: (error: any, user?: any, info?: any) => void) => {
                if (!accessToken || !profile.id) {
                    done(new ResponseError(AuthError.TokenError, "Token invalid"));
                    return;
                }
                done(null, profile, {accessToken, refreshToken});
            });
        Authenticator.passport.use(fbStrategy);
        const googleStrategy: PassportGoogle.Strategy = new PassportGoogle.Strategy(Authenticator.googleOptions,
            async (accessToken: string, refreshToken: string, profile: PassportGoogle.Profile, done: (error: any, user?: any, info?: any) => void) => {
                if (!accessToken || !profile.id) {
                    done(new ResponseError(AuthError.TokenError, "Token invalid"));
                    return;
                }
                done(null, profile, {accessToken, refreshToken});
            });
        Authenticator.passport.use(googleStrategy);
        return Authenticator.passport.initialize();
    }

    public static allow(permissions: string[], operation?: string): express.RequestHandler[] {
        return [
            Authenticator.authenticate(),
            Authenticator.permit(permissions, operation)
        ];
    }

    public static permit(permissions: string[], operation?: string) {
        return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
            return next();
        };
    }


    public static authenticate() {
        return Authenticator.passport.authenticate("jwt", { session: false });
    }

    public static authorizationHeader(tokenToQuery: boolean = false) {
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            const auth = req.header("Authorization");
            if (!auth) {
                res.status(400).json({error: "token_not_provided"});
                return;
            }
            if (tokenToQuery) {
                req.query.access_token = auth.substr(7);
            }
            return next();
        };
    }
    public static facebook() {
        return [
            Authenticator.authorizationHeader(false),
            Authenticator.passport.authenticate("facebook-token", { session: false })
        ];
    }
    public static google() {
        return [
            Authenticator.authorizationHeader(true),
            Authenticator.passport.authenticate("google-token", { session: false })
        ];
    }

    /**
     * Retrieve User from Redis session
     * @param {string} sessionId
     * @returns Promise<JsonResponse>
     */
    public static userExists(sessionId: string): Promise<JsonResponse<RedisUser|null>> {
        const response = new JsonResponse();
        return Redis.instance()
            .get(sessionId)
            .then((redisUser?: RedisUser) => {
                if (redisUser && redisUser._id) {
                    redisUser.sessionId = sessionId;
                    return response.ok(redisUser);
                }
                return response.ok(null);
            }).catch((error: Error) => {
                return response.exception(error);
            });
    }

    public static verify(token): IPayload {
        try {
            return <IPayload>jwt.verify(token, Authenticator.jwtOptions.secretOrKey, {algorithms: ["HS256"]});
        } catch (e) {}
        return {
            sessionId: null
        };
    }

    public static sign(sessionId: string, tokenDuration: string = process.env.TOKEN_DURATION, refreshTokenDuration: string = process.env.REFRESH_TOKEN_DURATION): ITokenResponse {
        const token = jwt.sign({ sessionId: sessionId }, Authenticator.jwtOptions.secretOrKey, { expiresIn: tokenDuration });
        const refreshToken = jwt.sign({ sessionId: sessionId, refresh: true }, Authenticator.jwtOptions.secretOrKey, { expiresIn: refreshTokenDuration });
        return {
            message: "Access and Refresh Tokens",
            token: token,
            refreshToken: refreshToken
        };
    }

    public static getTokenDurationsAndTTL(tokenDuration: string = null): ITokenDurations {
        // undefined means set the defaults
        const result: ITokenDurations = {
            tokenDuration: undefined,
            refreshTokenDuration: undefined,
            ttl: undefined
        };
        if (!tokenDuration) {
            return result;
        }
        let tNum = parseInt(tokenDuration.slice(0, -1));
        let tUnit: any = tokenDuration.substr(-1);
        let duration = moment.duration(tNum, tUnit);
        if (!duration.isValid()) {
            tokenDuration = process.env.TOKEN_DURATION || "10m";
            tNum = parseInt(tokenDuration.slice(0, -1));
            tUnit = tokenDuration.substr(-1);
            duration = moment.duration(tNum, tUnit);
        }
        result.tokenDuration = tokenDuration;
        result.refreshTokenDuration = process.env.REFRESH_TOKEN_DURATION || "7d";
        const rNum = parseInt(result.refreshTokenDuration.slice(0, -1));
        const rUnit: any = result.refreshTokenDuration.substr(-1);
        duration.add(rNum, rUnit);

        result.refreshTokenDuration = duration.asDays().toString() + "d";
        result.ttl = duration.asSeconds();
        return result;
    }

    public static auth(user: IUser, tokenDuration: string = null): Promise<JsonResponse<ITokenResponse>> {
        const response = new JsonResponse();
        const sessionId = uuid.v4();
        const redisUser: RedisUser = user;

        const durations = Authenticator.getTokenDurationsAndTTL(tokenDuration);
        tokenDuration = durations.tokenDuration;
        const refreshTokenDuration: string = durations.refreshTokenDuration;
        const ttl: number = durations.ttl;

        return Redis.instance()
            .set(sessionId, redisUser, ttl)
            .then((result: boolean) => {
                if (!result) {
                    return response.error("Failed to store token.", null, "Redis");
                }
                const tokenResponse = Authenticator.sign(sessionId, tokenDuration, refreshTokenDuration);
                return response.ok(tokenResponse);
            }).catch((error: Error) => {
                return response.exception(error);
            });
    }

    public static update(sessionId: string, user: IUser) {
        const response = new JsonResponse();
        const redisUser: RedisUser = user;
        return Redis.instance()
            .update(sessionId, redisUser)
            .then((result: boolean) => {
                if (!result) {
                    return response.error("Failed to update token.", null, "Redis");
                }
                const tokenResponse = Authenticator.sign(sessionId);
                return response.ok(tokenResponse);
            }).catch((error: Error) => {
                return response.exception(error);
            });
    }

    public static async refresh(sessionId: string): Promise<JsonResponse<ITokenResponse>> {
        const response = new JsonResponse();
        return Redis.instance()
            .refresh(sessionId)
            .then((result: boolean) => {
                if (!result) {
                    return response.error("Failed to refresh token.", null, "Redis");
                }
                const tokenResponse = Authenticator.sign(sessionId);
                return response.ok(tokenResponse);
            }).catch((error: Error) => {
                return response.exception(error);
            });
    }

    public static async logout(sessionId: string): Promise<JsonResponse<boolean>> {
        const response = new JsonResponse();
        if (!sessionId) {
            return response.ok(false);
        }
        return await Redis.instance()
            .delete(sessionId)
            .then((number: number) => {
                if (number === 1) { // key was found
                    return response.ok(true);
                }
                return response.ok(false);
            })
            .catch((error: Error) => {
                return response.exception(error);
            });
    }

    public static async extractUser(token: string): Promise<JsonResponse<RedisUser>> {
        const response = new JsonResponse<RedisUser>();
        try {
            const decoded: IPayload = Authenticator.verify(token);
            if (!decoded.sessionId) {
                return response.error("Invalid session", null, AuthError.SessionError);
            }
            const redisUser = await Redis.instance().get(decoded.sessionId);
            if (!redisUser) {
                return response.error("User not found", null, AuthError.UserNotFoundError);
            }
            return response.ok(redisUser, "user");
        } catch (e) {
            Logger.exception(e);
            return response.exception(e);
        }
    }

    public static async extractUserFromToken(token: string): Promise<IUser|null> {
        const userResponse = await this.extractUser(token);
        return userResponse.user || null;
    }

    public static checkForUser() {
        return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
            const authorization = req.header("authorization");
            if (authorization) {
                req.user = await Authenticator.extractUserFromToken(authorization.replace("Bearer ", ""));
            }
            next();
        };
    }
}
