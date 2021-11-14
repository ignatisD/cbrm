import { Application } from "express";

export interface IConnector {

    onAppReady: (app?: Application) => Promise<any>;
    init: (options: any) => Promise<any>;
    onDisconnect: () => Promise<void>;

}
