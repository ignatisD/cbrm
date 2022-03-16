/**
 * An extension of the Javascript Error
 * @extends Error
 * @property name string
 * @property message string
 * @type Error
 */
export interface IError extends Error {
    name: string;
    message: string;
    getMessage?(): string;
    toString?(): string;
    toObject?(): {[key: string]: string};
}
