export interface IRedisOptions {
    sentinels?: {host: string; port: number}[];
    name?: string;
    host?: string;
    port?: number;
    prefix?: string;
    apiName?: string;
}
