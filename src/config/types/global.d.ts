declare module "*.json" {
    const value: any;
    export default value;
}
/** @see Logger */
declare class Log {
    public static setStatics(debug?: boolean, end?: string, apm?: any, slack?: any): void;

    public static log(...args: any): void;

    public static debug(...args: any): void;

    public static pretty(...args: any): void;

    public static info(...args: any): void;

    public static warning(...args: any): void;

    public static error(...args: any): void;

    public static exception(...args: any): void;

    public static success(...args: any): void;

    public static report(err: Error, options?: any, skipSlack?: boolean): boolean;
}

declare namespace NodeJS {
    interface IRedisOptions {
        sentinels?: {host: string, port: number}[];
        name?: string;
        host?: string;
        port?: number;
        prefix?: string;
    }
    export interface Global {
        ServerRoot: string;
        ViewsRoot: string;
        Mailer: any;
        jwtOptions: any;
        languages: string[];
        requiredLanguages: string[];
        defaultLanguage: string;
        fallbackLanguage: string;
        envFile: string;
        prefix: string;
        isDevMode: boolean;
        isWorker: boolean;
        isMainWorker: boolean;
        disableTransactions: boolean;
        pagingLimit: number;
        Log: Log;
        API: string;
        Redis: IRedisOptions;
        renderHTML: (view: string, params?: any) => string;
        businessRegistry: { [key: string]: any };
        buildNumber: string;
    }
}
