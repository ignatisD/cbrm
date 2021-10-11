import * as moment from "moment";

/* tslint:disable */

export type Level = "DEBUG"|"INFO"|"ERROR"|"CRITICAL"|"WARNING"|"EMERGENCY"|"SEVERE"|"FATAL";

/**
 * Always remember to update the interface
 * @see Log
 */
export default class Logger {

    private static _apm: any = null;
    private static _debugEnabled: boolean = true;
    private static _end: string = "[~]development@localhost[~]";

    static red: string      = "31";
    static green: string    = "32";
    static yellow: string   = "33";
    static blue: string     = "34";

    private _color: string;
    private _level: Level;

    constructor(color: string = "0", level: Level = "DEBUG") {
        this._color = color;
        this._level = level;
    }

    public static setStatics(debugEnabled: boolean = true, end: string = "development@localhost", apm: any = null) {
        Logger._debugEnabled = debugEnabled;
        Logger._end = `[~]${end}[~]`;
        Logger._apm = apm;
    }

    private _log(...args: any): void {
        const timeStamp = "[" + moment().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]") + "] ";
        console.log(timeStamp + `\x1b[${this._color}m`, ...args, `\x1b[8m[~]${this._level}${Logger._end}\x1b[0m`);
    }

    /** @see Log.log */
    public static log(...args: any): void {
        new Logger()._log(...args);
    }

    /** @see Log.info */
    public static info(...args: any): void {
        new Logger(Logger.blue, "INFO")._log(...args);
    }

    /** @see Log.success */
    public static success(...args: any): void {
        new Logger(Logger.green, "INFO")._log(...args);
    }

    /** @see Log.warning */
    public static warning(...args: any): void {
        new Logger(Logger.yellow, "WARNING")._log(...args);
    }

    /** @see Log.error */
    public static error(...args: any): void {
        new Logger(Logger.red, "ERROR")._log(...args);
    }

    /** @see Log.exception */
    public static exception(...args: any): void {
        new Logger(Logger.red, "CRITICAL")._log(...args);
        Logger.report(args[0], args[1]);
    }

    /** @see Log.debug */
    public static debug(...args: any): void {
        if (!Logger._debugEnabled) {
            return;
        }
        new Logger()._log(...args);
    }

    /** @see Log.pretty */
    public static pretty(...args: any): void {
        if (!Logger._debugEnabled) {
            return;
        }
        let json = JSON.stringify((args.length === 1 ? args[0] : args), null, 4);
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        json = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
            const reset = "\x1b[0m";
            let color = '\x1b[1;36m'; // number -> blue
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    match = match.replace(/\"/g, '');
                    color = '\x1b[1;35m'; // key -> purple
                } else {
                    color = '\x1b[1;32m'; // string -> green
                }
            } else if (/true|false/.test(match)) {
                color = '\x1b[1;33m'; // boolean -> orange
            } else if (/null/.test(match)) {
                color = '\x1b[37m'; // null -> yellow
            }
            return color + match + reset;
        });
        new Logger()._log("\n" + json + "\n");
    }

    public static report(err: Error, options: any = {}): boolean {
        if (Logger._apm && err instanceof Error) {
            const captureOptions: any = {
                // request?: IncomingMessage;
                // response?: ServerResponse;
                // timestamp?: number;
                // handled?: boolean;
                // user?: UserObject;
                // labels?: Labels;
                // tags?: Labels;
                // custom?: object;
                // message?: string;
            };
            const user = options?.user || {};
            captureOptions.user = {
                id: user?._id?.toString() || null,
                username: user?.firstName ? user.firstName + " " + user.lastName : "Unknown User",
                email: user?.email || null
            };
            captureOptions.custom = options?.custom;
            Logger._apm.captureError(err, captureOptions);
            return true;
        }
        return false;
    }
}
/* tslint:enable */
