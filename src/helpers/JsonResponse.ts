import IResponse from "../interfaces/helpers/Response";
import IError from "../interfaces/helpers/Error";
import ResponseError from "./ResponseError";
import Logger from "./Logger";

/**
 * A quick access to a standardized Json Response
 * - success: boolean
 * - errors?: IError
 * - details?: any
 * - key: string
 * - [key: string]: any - You can add anything else dynamically
 *
 * Remember you can assign a type (T) to this class to assist in results type completion
 */
export default class JsonResponse<T = any> implements IResponse {

    /**
     * Property denoting the success of the operation
     */
    public success: boolean;
    /**
     * Property that stores the Errors produced by the operation (or the reason of failure)
     */
    public errors?: IError[];
    /**
     * A standard key to store details
     */
    public details?: any;
    /**
     * The response data that can be assigned to any key.
     * These data can optionally have a type
     */
    [key: string]: T|any;

    /**
     * The "key" that shows where our data - the main content of the response - is placed
     */
    public key: string = "data";

    /**
     * A static getter for a general purpose error
     */
    public static get responseError(): ResponseError {
        return new ResponseError("ResponseError", "Your request resulted in an error.");
    }


    /**
     * The class constructor. You can optionally pass another {@link IResponse} to clone it or any object for that matter
     * @param instance
     */
    constructor(instance?: IResponse) {
        this.assign(instance);
    }

    public assign(instance?: IResponse) {
        if (instance !== undefined) {
            Object.assign(this, instance);
        }
        if (this.success === undefined) {
            this.success = !this.errors;
        }
        return this;
    }

    /**
     * Method used to check for errors and data. Usually used in callbacks
     * @param errors
     * @param data
     * @param key
     * @param details
     */
    public check(errors?: IError[]|null, data?: T|any, key: string = "data", details?: any) {
        this.success = !(errors && errors.length > 0);
        this.key = key;
        if (errors) {
            this.errors = errors;
        }
        if (data) {
            this[key] = data;
        }
        if (details) {
            this.details = details;
        }
        return this;
    }

    /**
     * A generic setter method
     * @param key
     * @param data
     */
    public set(key: string, data: any) {
        this[key] = data;
        return this;
    }

    /**
     * The main method of extracting the main response content (data)
     */
    public get(): T {
        return this[this.key];
    }

    /**
     * Returns the reason for failing
     */
    public reason(): string {
        if (this.success) {
            return "";
        }
        return (this.errors[0] || JsonResponse.responseError).toString();
    }

    /**
     * Method to set debug information to this response
     * @param data
     */
    public setDebug(data: any) {
        this.set("debug", data);
        return this;
    }


    /**
     * Helper method to state a successful outcome.
     * ! Warning this method can override the default "data" key with one provided as the second parameter
     * @param data
     * @param key
     * @param details
     */
    public ok(data: T, key: string = "data", details?: any) {
        this.success = true;
        this[key] = data;
        this.key = key;
        if (details) {
            this.details = details;
        }
        return this;
    }

    /**
     * Method to quickly mark an unsuccessful response.
     * This method will always return a response with at least 1 error
     * @param errors
     * @param details
     */
    public fail(errors?: IError[]|null, details?: any) {
        this.success = false;
        this.errors = errors || [JsonResponse.responseError];
        if (details) {
            this.details = details;
        }
        return this;
    }

    /**
     * Method to add an error to this response
     * @param error
     */
    public addError(error: IError|IError[]) {
        if (!this.errors) {
            this.errors = [];
        }
        if (Array.isArray(error)) {
            this.errors.push(...error);
        } else {
            this.errors.push(error);
        }
        return this;
    }

    /**
     * Method to convert a string error to a {@link ResponseError} class
     * which conforms with {@link IError} found on the "errors" property
     * @param error
     * @param details
     * @param errorType
     */
    public error(error?: string, details?: any, errorType: string = "Error") {
        this.success = false;
        let err: IError = error ? new ResponseError(errorType, error, details) : JsonResponse.responseError;
        this.addError(err);
        return this;
    }

    /**
     * Method to convert a string error to a {@link ResponseError} class
     * which conforms with {@link IError} found on the "errors" property
     * and also log a warning of the error
     * @param error
     * @param details
     * @param warn
     */
    public warn(error?: string, details?: any, warn: boolean = true) {
        this.success = false;
        let err: IError = error ? new ResponseError("Warning", error, details) : JsonResponse.responseError;
        this.addError(err);
        Logger.warning(error, details);
        return this;
    }

    /**
     * Method to convert an Exception/Error to the {@link IError} interface through the {@link ResponseError} class
     * @param error
     * @param details
     * @param errorType
     */
    public exception(error?: Error, details?: any, errorType: string = "Exception") {
        this.success = false;
        if (error) {
            let stack: any[] = error.stack ? error.stack.split("\n") : [];
            if (details) {
                stack.push(details);
            }
            this.addError(new ResponseError(error.name, error.message, stack));
        } else {
            this.addError(new ResponseError(errorType, "The request resulted in an Exception", details));
        }
        return this;
    }

    /**
     * Static helper to generate an exception response
     * @param exception
     * @param details
     */
    public static caught<R = any>(exception: Error, details?: any) {
        return new JsonResponse<R>().exception(exception, details);
    }

    public static notImplemented<R = any>(details?: any) {
        return new JsonResponse<R>().exception(new ResponseError("Error", "Not Implemented", details));
    }

    /**
     * Same as {@link toJson} method
     */
    public toString(): string {
        return this.toJson();
    }

    /**
     * Method to stringify the response object
     */
    public toJson(): string {
        return JSON.stringify(this);
    }
}
