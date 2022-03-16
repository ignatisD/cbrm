import { IExtraLanguageOptions } from "./Multilingual";

export interface IServerConfiguration {
    apiName: string;
    envFile: string;
    languageOptions?: i18n.ConfigurationOptions & IExtraLanguageOptions;
    useDefaultLanguageOptions?: boolean;
    corsHeaders?: string[];
    bodyLimit?: string;
    queues?: boolean;
}
