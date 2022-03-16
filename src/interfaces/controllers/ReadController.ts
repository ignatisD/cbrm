import * as express from "express";

export interface IReadController {
    retrieve: express.RequestHandler;
    findById: express.RequestHandler;
}
