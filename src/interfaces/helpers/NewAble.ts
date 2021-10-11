export interface NewAble<T = any> {
    new(props?: Partial<T>): T;
}