import { ConfigurationOptions } from "i18n";
import { IRedisOptions } from "./Redis";
import { IExtraLanguageOptions } from "./Multilingual";

export interface GlobalConfiguration extends Record<string, any> {
    // Required configurations
    envFile: string;
    apiName: string;
    isDevMode?: boolean;

    // general options
    pagingLimit?: number;
    disableTransactions?: boolean;

    // express options
    corsHeaders?: string[];
    bodyLimit?: string;
    ServerRoot?: string;
    ViewsRoot?: string;
    renderHTML?: (view: string, params?: any) => string;

    // i18n options
    useDefaultLanguageOptions?: boolean;
    languageOptions?: ConfigurationOptions & IExtraLanguageOptions;
    languages?: string[];
    requiredLanguages?: string[];
    defaultLanguage?: string;
    fallbackLanguage?: string;

    // queues
    Redis?: IRedisOptions;
    prefix?: string;
    queues?: boolean;
    isWorker?: boolean;
    isMainWorker?: boolean;

    // extra options
    buildNumber?: string;
    jwtOptions?: any;
    appEmail?: string;
    appName?: string;
}
