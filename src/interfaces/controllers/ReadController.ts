import * as express from "express";

export default interface IReadController {
    retrieve: express.RequestHandler;
    findById: express.RequestHandler;
}
