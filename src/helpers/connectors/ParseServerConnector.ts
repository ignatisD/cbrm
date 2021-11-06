import { Application } from "express";
import { IConnector } from "@interfaces/helpers/Connector";
import * as Parse from "parse/node";
import { ParseServer } from "parse-server";
import * as ParseDashboard from "parse-dashboard";

export default class ParseServerConnector implements IConnector {

    protected _uri: string = "mongodb://localhost:27017/test";

    protected _api: any;
    protected _dashboard: any;

    constructor() {

    }

    public init(opts: { uri: string }) {
        this._uri = opts.uri;
        this._api = new ParseServer({
            databaseURI: this._uri,
            appId      : process.env.APP_ID,
            masterKey  : process.env.MASTER_KEY,
            fileKey    : process.env.FILE_KEY,
            serverURL  : process.env.SERVER_URL,
            maxUploadSize: "5mb"
        });
        // Start Parse Dashboard
        this._dashboard = new ParseDashboard({
            apps: [
                {
                    serverURL               : process.env.SERVER_URL,
                    appId                   : process.env.APP_ID,
                    appName                 : process.env.APP_NAME,
                    appNameForURL           : process.env.APP_NAME.toLowerCase(),
                    masterKey               : process.env.MASTER_KEY,
                    primaryBackgroundColor  : "#000000",
                    secondaryBackgroundColor: "#3B3B3B"
                }
            ],
            users: [
                {
                    user: "admin",
                    pass: process.env.APP_PASS
                }
            ]
        }, {
            allowInsecureHTTP: true
        });
        // Start Parse (will be available globally)
        Parse.initialize(process.env.APP_ID, process.env.MASTER_KEY);
        return Promise.resolve(true);
    }

    public onAppReady(app: Application) {
        app.use("/api/parse",  this._api);
        app.use("/api/dashboard", this._dashboard);
        return Promise.resolve();
    }

    public onDisconnect() {
        return Promise.resolve()
            .then(() => {
                Log.warning("Parse disconnect: no errors");
            })
            .catch((err) => {
                Log.error("Parse disconnect: ", err);
            });
    }
}