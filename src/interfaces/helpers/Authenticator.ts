import * as express from "express";
import { IUser } from "../models/User";
import { IResponse } from "./Response";

export interface IAuthenticator {
    initialize: (...args: any) => any;
    allow: (permissions: string[], operation?: string) => express.RequestHandler[];
    checkForUser: express.RequestHandler;
    extractUser: (...args: any) => Promise<IResponse<Partial<IUser>>>;
}
