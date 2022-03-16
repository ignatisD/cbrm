import { Server } from "../src";
import { GlobalState } from "../src";
import { IServerConfiguration } from "../src";
import { StateManager } from "../src";
import { IRoute } from "../src";

export interface MyGlobalState extends GlobalState {
    myGlobalVar: any;
    applicationEmail: string;
}

export class TestServer extends Server<MyGlobalState> {

    constructor(configuration: IServerConfiguration) {
        super(configuration);
    }

    public databaseConnection(): Promise<unknown> {
        this._connector = new StateManager();
        return this._connector.init();
    }

    public getApplicationRoutes(): IRoute[] {
        const ApplicationController = require("./controllers/ApplicationController").default;
        return new ApplicationController().routes();
    }

}
