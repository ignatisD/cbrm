import { ExtraLanguageOptions } from "../../config/languageOptions";

export interface IServerConfiguration {
    apiName: string;
    envFile: string;
    languageOptions?: i18n.ConfigurationOptions & ExtraLanguageOptions;
    corsHeaders?: string[];
    bodyLimit?: string;
    queues?: boolean;
}
