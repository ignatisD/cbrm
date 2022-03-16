import * as cbrm from "../src";

export interface MyGlobalState extends cbrm.GlobalState {
    myGlobalVar: any;
    applicationEmail: string;
}

export class TestServer extends cbrm.Server<MyGlobalState> {

    constructor(configuration: cbrm.IServerConfiguration) {
        super(configuration);
    }

    public databaseConnection(): Promise<unknown> {
        this._connector = new cbrm.StateManager();
        return this._connector.init();
    }

    // public bootstrapWorkers() {
    //     const redisOptions: cbrm.IRedisOptions = {
    //         host: process.env.REDIS_HOST,
    //         port: parseInt(process.env.REDIS_PORT || "6379"),
    //         prefix: "test"
    //     }
    //     cbrm.Queue.bootstrap(redisOptions, this._global.get("isMainWorker", false) ? this.app : null);
    // }

    public getApplicationRoutes(): cbrm.IRoute[] {
        const { ApplicationController } = require("./controllers/ApplicationController");
        return new ApplicationController().routes();
    }
}
