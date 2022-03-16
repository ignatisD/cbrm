import * as cbrm from "../src";

export interface MyConfiguration extends cbrm.GlobalConfiguration {
    myGlobalVar?: any;
}

export class TestServer extends cbrm.Server<MyConfiguration> {

    constructor(configuration: cbrm.Configuration<MyConfiguration>) {
        super(configuration);
    }

    public databaseConnection(): Promise<unknown> {
        this._connector = new cbrm.Configuration();
        return this._connector.init();
    }

    public getApplicationRoutes(): cbrm.IRoute[] {
        const { ApplicationController } = require("./controllers/ApplicationController");
        return new ApplicationController().routes();
    }
}
