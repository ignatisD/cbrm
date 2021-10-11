import express = require("express");

export default interface IReadController {
    retrieve: express.RequestHandler;
    findById: express.RequestHandler;
}
