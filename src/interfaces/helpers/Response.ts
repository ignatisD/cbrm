export interface IResponse<T = any> {
    success: boolean;
    errors?: any;
    details?: any;
    [key: string]: T|any;
}

export interface IApiResponse<T = any> {
    command: string;
    request: any;
    response: T;
    exception: Error | null;
    debug?: any;
}
