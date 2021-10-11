import IError from "@interfaces/common/Error";

/**
 * A wrapper class for general API Errors
 * @property name string
 * @property message string
 * @property details any
 * @type IError
 */
export default class ResponseError implements IError {

    public readonly name: string;
    public readonly message: string;
    public readonly details: any;

    constructor(name: string, message: string, details?: any) {
        this.name = name;
        this.message = message;
        if (details)
            this.details = details;
    }

    public static fromError(e: Error) {
        let stack: string[];
        if (e.stack) {
            stack = e.stack.split("\n");
        }
        return new ResponseError(e.name, e.message, stack);
    }

    public getMessage() {
        return this.message;
    }

    public toString() {
        return `${this.name}: ${this.message}`;
    }

    public toObject() {
        let error: {[key: string]: string} = {};
        error[this.name] = this.message;
        return error;
    }

}