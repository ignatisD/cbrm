declare module "*.json" {
    const value: any;
    export default value;
}
declare namespace NodeJS {
    interface IRedisOptions {
        sentinels?: {host: string; port: number}[];
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
        API: string;
        Redis: IRedisOptions;
        renderHTML: (view: string, params?: any) => string;
        businessRegistry: { [key: string]: any };
        buildNumber: string;
    }
}
