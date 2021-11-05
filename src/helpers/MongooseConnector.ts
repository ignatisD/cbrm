import { disconnect, plugin, connect, ConnectOptions } from "mongoose";
import * as mongoosePaginate from "mongoose-paginate-v2";
import * as mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import * as mongooseSlugUpdater from "mongoose-slug-updater";
import realIntl from "@helpers/RealIntl";

export default class MongooseConnector {

    protected _uri: string = "mongodb://localhost:27017/test";
    protected _options: ConnectOptions = {
        socketTimeoutMS: 600000
    };

    constructor(opts: { uri: string; options?: ConnectOptions }) {
        this._uri = opts.uri;
        if (opts.options) {
            this._options = opts.options;
        }
    }

    public init() {
        // TODO: add plugin options to activate only required plugins
        plugin(mongoosePaginate);
        plugin(mongooseAggregatePaginate);
        plugin(mongooseSlugUpdater);
        plugin(realIntl, {
            languages: global.languages,
            defaultLanguage: global.defaultLanguage,
            fallback: global.fallbackLanguage
        });
        // Mongoose connect (Promise)
        return connect(this._uri, this._options).then(
            // On Success
            (instance) => {
                // PM2 ready signal!
                process.send = process.send || function () { return false; };
                process.send("ready");
                // optional use in development
                instance.set("debug", process.env.MONGODB_DEBUG === "true");
                // Connection Successful
                Log.success("Database: " + instance.connection.db.databaseName);
                return instance;
            },
            // On Error
            (err) => {
                Log.exception(err, "MongoDB connection error. Please make sure MongoDB is running.");
                process.exit();
                return undefined;
            }
        );
    }

    public onDisconnect() {
        return disconnect()
        .then(() => {
            Log.warning("Mongoose disconnect: no errors");
        })
        .catch((err) => {
            Log.error("Mongoose disconnect: ", err);
        });
    }
}