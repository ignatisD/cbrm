export interface NewAble<T = any> {
    new(...args: any[]): T;
}