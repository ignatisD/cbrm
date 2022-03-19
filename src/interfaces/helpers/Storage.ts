export interface IStorage {
    get: (key: string) => any;
    set: (key: string, value: any) => any;
    has: (key: string) => any;
    unset: (key: string) => any;
    push?: (key: string, value: any[]) => any;
}
