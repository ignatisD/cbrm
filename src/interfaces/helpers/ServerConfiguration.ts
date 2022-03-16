export interface IServerConfiguration {
    apiName: string;
    envFile: string;
    languageOptions?: any;
    corsHeaders?: string[];
    bodyLimit?: string;
    queues?: boolean;
}
