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
import * as path from "path";
import * as v8 from "v8";

// Interfaces
import { IConnector } from "./interfaces/helpers/Connector";
import IRoute from "./interfaces/helpers/Route";

// Set Logger
import Logger from "./helpers/Logger";


// Modules | Keep Sorted By Variable Name
import Authenticator from "./helpers/Authenticator";
import Helpers from "./helpers/Helpers";
import { IMailerOptions, Mailer } from "./helpers/Mailer";
import Queue from "./helpers/Queue";
import Route from "./helpers/Route";
import JsonResponse from "./helpers/JsonResponse";
import { IServerConfiguration } from "./helpers/ServerConfiguration";

/**
 * Server class
 * @param envFile Is the path of the environmental variables file
 */
export default class Server {

    protected static authenticator: typeof Authenticator = null;
    static up: boolean = false;
    // Keep Sorted By Variable Name
    public app: express.Application;
    public cors: any;
    public port: number;
    public serverName: any;
    public useSSL: boolean;
    public sslDir: string;
    public serverTimeout: number = 300000; // 5 minutes

    protected _secret: string = "01A10A01A10A01A10A01A10A";
    protected _logFormat: string = "";
    protected _server: http.Server|https.Server = null;
    protected _dbPromise: Promise<any> = new Promise(() => void 0);
    protected _connector: IConnector = null;
    protected readonly _configuration: IServerConfiguration;

    constructor(configuration: IServerConfiguration) {
        this._configuration = configuration;
    }

    public static setAuthenticator(authenticator: typeof Authenticator = null) {
        this.authenticator = authenticator;
    }

    public static bootstrap(configuration: IServerConfiguration): Promise<Server> {
        return new this(configuration).init();
    }

    public static test(configuration: IServerConfiguration): Server {
        const server = new this(configuration);
        server.env();
        server.configure();
        return server;
    }

    public get config() {
        return this._configuration;
    }

    // Methods to override

    public databaseConnection() {
        return new Promise(() => void 0);
    }

    public i18nStart() {
        if (!this.config.languageOptions) {
            return;
        }
        if (this.config.languageOptions === true) {
            this.config.languageOptions = require("./config/languageOptions");
        }
        global.languages = this.config.languageOptions.locales;
        global.requiredLanguages = this.config.languageOptions.requiredLanguages;
        global.defaultLanguage = this.config.languageOptions.defaultLocale;
        global.fallbackLanguage = this.config.languageOptions.fallbackLocale;
        i18n.configure(this.config.languageOptions);
        this.app.use(i18n.init);
    }

    public getApplicationRoutes(): IRoute[] {
        return [];
    }

    public registerRoutes() {
        // Welcome
        const router = express.Router();

        // external route template
        const routes = this.getApplicationRoutes();
        routes.forEach((_route: IRoute) => {
            const route = new Route(_route, Server.authenticator);
            route.register(router);
        });

        // catch 404
        router.use((req: express.Request, res: express.Response) => {
            res.status(404).json(new JsonResponse().error(`Not Found ${req.path}`));
        });

        return router;
    }

    /**
     * Override this with your global middlewares
     */
    public globalMiddlewares() {
        // this.app.use();
    }

    public bootstrapWorkers() {
        Logger.debug("Starting queues");
        Queue.bootstrap(global.isMainWorker ? this.app : null);
    }

    public async workersListen() {
        if (global.isWorker) {
            await this._dbPromise;
            Queue.workersListen();
            Logger.success("Workers are listening");
        }
    }


    // Main methods

    public async init() {

        //load env variables
        this.env();

        //configure application
        this.configure();


        //connect to database
        this._dbPromise = this.databaseConnection().then((result) => {
            Server.up = typeof result !== "undefined";
            Logger.success("Database connection successful");
        }).catch((e) => {
            Logger.exception(e);
            process.exit(1);
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
        dotenv.config({path: this.config.envFile});
        global.envFile = this.config.envFile;
        global.prefix = process.env.PREFIX || "dev";
        global.buildNumber = process.env.BUILD || "build-dev";

        this.port = parseInt(process.env.NODE_PORT || "3000");
        this.serverName = process.env.SERVER_NAME || "localhost";
        this.serverTimeout = parseInt(process.env.SERVER_TIMEOUT || "300000");
        this.cors = (process.env.CORS_URLS || "*").split(",");
        this.useSSL = Helpers.isTrue(process.env.USE_SSL);
        this.sslDir = process.env.SSL_DIR || "/etc/ssl";
        this._secret = process.env.SECRET_OR_KEY || "01A10A01A10A01A10A01A10A";
        this._logFormat = process.env.LOG_FORMAT || ":real_ip - :remote-user [:date[clf]] \":method :url HTTP/:http-version\" :status :res[content-length] \":referrer\" \":user-agent\"";

        global.isDevMode = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
        global.isWorker = global.isDevMode || process.env.NODE_ENV === "worker";
        global.isMainWorker = global.isDevMode || process.env.NODE_TYPE === "main-worker";
        global.API = this.config.apiName || "cbrm";
    }

    public configure() {
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
        Logger.setStatics(process.env.DEBUG !== "false", `${process.env.NODE_ENV}@${process.env.HOSTNAME}`);

        // Initialize Languages

        global.businessRegistry = {};
    }

    public async express() {

        if (Server.authenticator) {
            this.app.use(new Server.authenticator(this._secret).initialize());
        }

        this.app.set("views", path.join(__dirname, "../views"));
        this.app.set("view engine", "pug");
        // Global RenderHTML fro pug templates
        global.renderHTML = Helpers.renderHTML(this.app);

        // Express configuration.
        this.app.set("port", this.port);
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
            exposedHeaders: this.config.corsHeaders || [
                "x-build-number"
            ]
        }));
        logger.token<express.Request>("real_ip", (req, res) => {
            return Helpers.requestIp(req);
        });
        this.app.use(compression());
        this.app.use(logger(process.env.MORGAN_FORMAT === "combined" ? this._logFormat : "dev", {
            skip: function (req, res) {
                return res.statusCode < 400 && res.statusCode !== 401;
            }
        }));
        this.app.use(cookieParser());
        this.app.use(bodyParser.json({limit: "50mb"}));
        this.app.use(bodyParser.urlencoded({extended: true}));


        this.i18nStart();

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


        await this._dbPromise;

        // Add API routes
        this.app.use(this.registerRoutes());

        this.globalMiddlewares();

        await this.workersListen();

    }

    public createServer() {

        // Logs
        const totalHeapSizeInKB = (((v8.getHeapStatistics().total_available_size) / 1024).toFixed(2));
        const totalHeapSizeInGB = (((v8.getHeapStatistics().total_available_size) / 1024 / 1024 / 1024).toFixed(2));
        Logger.debug(`*******************************************`);
        Logger.debug(`Total Heap Size ~${totalHeapSizeInKB}KB`);
        Logger.debug(`Total Heap Size ~${totalHeapSizeInGB}GB`);
        Logger.debug(`*******************************************`);
        Logger.debug("Path of file in parent dir:", path.resolve(__dirname, "server.ts"));

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
        this._server.timeout = this.serverTimeout;

        this._server.on("listening", () => {
            Logger.success(`  App is running at http://${global.API}:${this.port} in ${process.env.NODE_ENV} mode`);
            Logger.debug("  Press CTRL+C to stop");
        });

        this._server.on("error", Logger.error);

        process.on("exit", (code) => {
            Logger.warning("Process exiting with code:", code);
        });

        if (process.env.NODE_ENV !== "development") {
            process.on("SIGINT", this.shutdown.bind(this));

            process.on("SIGTERM", this.shutdown.bind(this));

            process.on("SIGUSR2", this.shutdown.bind(this));
        } else {
            process.on("warning", (warning) => {
                Logger.pretty(warning.stack?.split("\n"));
            });
        }
    }

    public async close() {
        return new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(resolve, 5000);
            this._server.close((err) => {
                clearTimeout(timeout);
                if (err) {
                    Logger.error("Express stopped: ", err);
                } else {
                    Logger.warning("Express stopped: no errors");
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
        Logger.warning("STOP SERVER: " + term);
        try {
            Server.up = false;
            await this.close();
            await Queue.shutdown();
            await this.disconnect();
            process.exit(0);
        } catch (e) {
            Logger.exception(e, {source: "Server.shutdown"});
            process.exit(1);
        }
    }

}
