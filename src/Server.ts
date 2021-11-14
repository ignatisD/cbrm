// Third Party Modules | Keep Sorted By Variable Name
import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import * as cors from "cors";
import * as dotenv from "dotenv";
import * as express from "express";
import * as fs from "fs";
import * as helmet from "helmet";
import * as noCache from "nocache";
import * as http from "http";
import * as https from "https";
import * as i18n from "i18n";
import * as logger from "morgan";
import * as passport from "passport";
import * as path from "path";
import * as v8 from "v8";

// Set Language Options
import { languageOptions } from "@config/languageOptions";
global.languages = languageOptions.locales;
global.requiredLanguages = languageOptions.requiredLanguages;
global.defaultLanguage = languageOptions.defaultLocale;
global.fallbackLanguage = languageOptions.fallbackLocale;

// Set Logger
import Logger from "@helpers/Logger";
global.Log = Logger;


// Modules | Keep Sorted By Variable Name
import Authenticator from "@helpers/Authenticator";
import Helpers from "@helpers/Helpers";
import { Agent } from "elastic-apm-node";
import { IMailerOptions, Mailer } from "@config/Mailer";
import { IConnector } from "@interfaces/helpers/Connector";
import Queue from "@config/Queue";

/**
 * Our Server class
 * * Remember this is our main class
 * ! Do not use it without permission
 * ? Are you a good boy to let you use it wherever you want?
 * @param envFile Is the path of the environmental variables that you want to use
 */
export default class Server {

    static up: boolean = false;
    // Keep Sorted By Variable Name
    public app: express.Application;
    public cors: any;
    public port: any;
    public serverName: any;
    public useSSL: boolean;
    public sslDir: string;

    private readonly envFile: string;
    protected apm: Agent = null;

    protected _server: http.Server|https.Server = null;
    protected _dbPromise: Promise<any> = new Promise(() => void 0);
    protected _connector: IConnector = null;

    constructor(envFile: string) {
        this.envFile = envFile;
    }

    public static bootstrap(envFile: string = ".env"): Promise<Server> {
        return new Server(envFile).init();
    }

    public static test(envFile: string = ".env.test"): Server {
        const server = new Server(envFile);
        server.env();
        server.config();
        return server;
    }

    public async init() {

        //load env variables
        this.env();

        //configure application
        this.config();


        //connect to database
        this._dbPromise = this.databaseConnection().then((result) => {
            Server.up = typeof result !== "undefined";
            //register business to the global registry (IRS)
            // const commonBusiness = require("@business/CommonBusiness").default;
            // commonBusiness.registerBusinesses();
        });

        //create express application
        this.app = express();

        // Express configuration.
        await this.express();

        //create server
        this.createServer();

        return this;
    }

    public env() {
        // Load environment variables from .env file, where API keys and passwords are configured.
        dotenv.config({path: this.envFile});
        global.envFile = this.envFile;
        global.prefix = process.env.PREFIX || "dev";
        global.buildNumber = process.env.BUILD || "build-dev";

        this.cors = (process.env.CORS_URLS || "*").split(",");
        this.port = process.env.NODE_PORT || 3000;
        this.serverName = process.env.SERVER_NAME || "localhost";
        this.useSSL = process.env.USE_SSL === "true";
        this.sslDir = process.env.SSL_DIR || "/etc/ssl";

        global.isDevMode = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
        global.isWorker = global.isDevMode || process.env.NODE_ENV === "worker";
        global.isMainWorker = global.isDevMode || process.env.NODE_TYPE === "main-worker";
        global.API = "cbrm";
    }

    public config() {
        require("events").EventEmitter.defaultMaxListeners = 100;
        const mailOptions: IMailerOptions = {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465
        };
        if (process.env.SMTP_SECURE) {
            mailOptions.secure = true;
        }
        if (process.env.SMTP_AUTH_USER && process.env.SMTP_AUTH_PASS) {
            mailOptions.user = process.env.SMTP_AUTH_USER;
            mailOptions.pass = process.env.SMTP_AUTH_PASS;
        }
        global.Mailer = Mailer.setup(mailOptions);
        global.ServerRoot = path.resolve(__dirname);
        global.ViewsRoot = path.join(__dirname, "../views");
        global.pagingLimit = 100;
        if (process.env.ELASTIC_APM_SERVER_URL) {
            this.apm = require("elastic-apm-node").start({
                serviceName: global.API,
                serviceVersion: "1.0.0",
                serverUrl: process.env.ELASTIC_APM_SERVER_URL,
                environment: process.env.NODE_ENV,
                frameworkName: global.API,
                frameworkVersion: process.env.BUILD,
                captureErrorLogStackTraces: "always",
                transactionSampleRate: 0.1,
                captureHeaders: false,
                captureSpanStackTraces: false,
                centralConfig: true,
                // instrument: false,
                // instrumentIncomingHTTPRequests: false,
                disableInstrumentations: [
                    "ws"
                ],
                ignoreUrls: [
                    "/healthcheck"
                ]
            });
        }
        Log.setStatics(process.env.DEBUG !== "false", `${process.env.NODE_ENV}@${process.env.HOSTNAME}`);

        // Initialize Languages
        i18n.configure(languageOptions);

        global.businessRegistry = {};
    }

    public databaseConnection() {
        return new Promise(() => void 0);
    }

    /**
     * You should override this with your own request authenticator
     */
    public authenticator() {
        // Initialize the default Authenticator
        const secret = process.env.SECRET_OR_KEY || "01A10A01A10A01A10A01A10A";
        this.app.use(new Authenticator(secret).initialize());
    }

    public async express() {

        this.authenticator();

        // Express configuration.
        this.app.set("port", this.port);
        this.app.set("views", path.join(__dirname, "../views"));
        this.app.set("view engine", "pug");
        this.app.set("etag", false);
        this.app.use("/healthcheck", require("express-healthcheck")(
            {
                test: function (callback) {
                    if (Server.up === true) {
                        callback();
                    } else {
                        callback({state: Server.up});
                    }
                }
            }
        ));
        this.bootstrapWorkers();
        this.app.use(helmet());
        this.app.use(noCache());
        this.app.use(cors({
            origin: (origin, cb) => cb(null, this.cors.includes("*") || this.cors.includes(origin)),
            credentials: true,
            exposedHeaders: [
                "x-build-number"
            ]
        }));
        logger.token<express.Request>("real_ip", (req, res) => {
            return Helpers.requestIp(req);
        });
        const COMBINEDAPACHELOG = ":real_ip - :remote-user [:date[clf]] \":method :url HTTP/:http-version\" :status :res[content-length] \":referrer\" \":user-agent\"";
        this.app.use(compression());
        this.app.use(logger(process.env.MORGAN_FORMAT === "combined" ? COMBINEDAPACHELOG : "dev", {
            skip: function (req, res) {
                return res.statusCode < 400 && res.statusCode !== 401;
            }
        }));
        this.app.use(cookieParser());
        this.app.use(bodyParser.json({limit: "50mb"}));
        this.app.use(bodyParser.urlencoded({extended: true}));
        this.app.use(passport.initialize());
        this.app.use("/static", express.static(path.join(__dirname, "../uploads")));

        this.app.use(i18n.init);
        this.app.use((req, res, next) => {
            let locale: string;
            if (req.query.lang && global.languages.indexOf(req.query.lang.toString()) !== -1) {
                locale = req.query.lang.toString();
            } else if (req.query.l && global.languages.indexOf(req.query.l.toString()) !== -1) {
                locale = req.query.l.toString();
            } else if (req.cookies.lang && global.languages.indexOf(req.cookies.lang.toString()) !== -1) {
                locale = req.cookies.lang.toString();
            } else if (req.headers["x-lang"] && global.languages.indexOf(req.headers["x-lang"].toString()) !== -1) {
                locale = req.headers["x-lang"].toString();
            } else {
                locale = Helpers.getLangByReferer(req.headers.referer) || global.defaultLanguage;
            }
            req.setLocale(locale);

            next();
        });

        if (this._connector) {
            await this._connector.onAppReady(this.app);
        }

        // Global RenderHTML fro pug templates
        global.renderHTML = Helpers.renderHTML(this.app);

        await this._dbPromise;

        // Add Api routes
        const BaseRoutes = require("@routes/base/BaseRoutes").default;
        this.app.use(new BaseRoutes().register());

        if (this.apm) {
            // Add the Elastic APM middleware after your regular middleware
            this.app.use(this.apm.middleware.connect());
        }
        this.workersListen();
    }

    public createServer() {

        // Logs
        const totalHeapSizeInKB = (((v8.getHeapStatistics().total_available_size) / 1024).toFixed(2));
        const totalHeapSizeInGB = (((v8.getHeapStatistics().total_available_size) / 1024 / 1024 / 1024).toFixed(2));
        Log.debug(`*******************************************`);
        Log.debug(`Total Heap Size ~${totalHeapSizeInKB}KB`);
        Log.debug(`Total Heap Size ~${totalHeapSizeInGB}GB`);
        Log.debug(`*******************************************`);
        Log.debug("Path of file in parent dir:", path.resolve(__dirname, "server.ts"));

        // SSL Check
        const sslKey = path.join(this.sslDir, "server.key.pem");
        const sslCert = path.join(this.sslDir, "server.crt.pem");
        if (this.useSSL && fs.existsSync(sslKey) && fs.existsSync(sslCert)) {
            const sslOptions = {
                key: fs.readFileSync(sslKey),
                cert: fs.readFileSync(sslCert),
                requestCert: false,
                rejectUnauthorized: false
            };
            this._server = https.createServer(sslOptions, this.app);
        } else {
            this._server = http.createServer(this.app);
        }

        // Start Express server.
        this._server.listen(this.app.get("port"));
        this._server.timeout = 600000;

        this._server.on("listening", () => {
            Log.success(`  App is running at http://${global.API}:${this.port} in ${process.env.NODE_ENV} mode`);
            Log.debug("  Press CTRL+C to stop");
        });

        this._server.on("error", Log.error);

        process.on("exit", (code) => {
            Log.warning("Process exiting with code:", code);
        });

        if (process.env.NODE_ENV !== "development") {
            process.on("SIGINT", this.shutdown.bind(this));

            process.on("SIGTERM", this.shutdown.bind(this));

            process.on("SIGUSR2", this.shutdown.bind(this));
        } else {
            process.on("warning", (warning) => {
                Log.pretty(warning.stack?.split("\n"));
            });
        }
    }

    public bootstrapWorkers() {
        Log.debug("Starting queues");
        Queue.bootstrap(global.isMainWorker ? this.app : null);
    }

    public async workersListen() {
        if (global.isWorker) {
            await this._dbPromise;
            Queue.workersListen();
            Log.success("Workers are listening");
        }
    }

    public async close() {
        return new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(resolve, 5000);
            this._server.close((err) => {
                clearTimeout(timeout);
                if (err) {
                    Log.error("Express stopped: ", err);
                } else {
                    Log.warning("Express stopped: no errors");
                }
                resolve();
            });
        });
    }
    public async disconnect() {
        if (this._connector) {
            await this._connector.onDisconnect();
        }
        return Promise.resolve();
    }
    public async shutdown(term: NodeJS.Signals = "SIGTERM") {
        Log.warning("STOP SERVER: " + term);
        try {
            Server.up = false;
            await this.close();
            await Queue.shutdown();
            await this.disconnect();
            process.exit(0);
        } catch (e) {
            Log.exception(e, {source: "Server.shutdown"});
            process.exit(1);
        }
    }

}
