export type Primitive = string | number | boolean | bigint | symbol | undefined | null;

/** Like Partial but recursive */
export type DeepPartial<T> = T extends Primitive | Function | Date
    ? T
    : T extends Map<infer K, infer V>
        ? Map<DeepPartial<K>, DeepPartial<V>>
        : T extends Set<infer U>
            ? Set<DeepPartial<U>>
            : T extends {}
                ? { [K in keyof T]?: DeepPartial<T[K]> }
                : Partial<T>;