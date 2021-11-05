import {
    body,
    check,
    oneOf,
    Result,
    ValidationChain,
    validationResult,
    param,
    query,
    ValidationError
} from "express-validator/check";
import ResponseError from "@helpers/common/ResponseError";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { sanitize, sanitizeBody, sanitizeParam, sanitizeQuery, SanitizationChain } from "express-validator/filter";
import JsonResponse from "@helpers/JsonResponse";

/**
 * A Validator class with static methods from express-validator
 */
export default class Validator {

    /**
     * Formatter of the validation error
     * @param {ValidationError} error
     * @returns {ResponseError}
     */
    static errorFormatter(error: ValidationError) {
        if (error.param === "password" || error.param === "passwordConfirm") {
            error.value = "******";
        }
        return new ResponseError(error.param, error.msg, error);
    }
    /**
     * Creates a middleware instance that will ensure at least one of the given chains passes the validation.
     * @param {(ValidationChain | ValidationChain[])[]} chains
     * @param {string} message
     * @returns {RequestHandler}
     */
    static oneOf(chains: (ValidationChain| ValidationChain[])[], message?: string): RequestHandler {
        return oneOf(chains, message);
    }

    /** Check Methods */
    /**
     * Main validation method
     * @param {string} key
     * @returns {ValidationChain}
     */
    static check(key: string): ValidationChain {
        return check(key);
    }

    /**
     * Main validation method
     * @param {string} key
     * @returns ValidationChain
     */
    static checkParam(key: string): ValidationChain {
        return param(key);
    }

    /**
     * Main validation method
     * @param {string} key
     * @returns ValidationChain
     */
    static checkBody(key: string): ValidationChain {
        return body(key);
    }

    /**
     * Main validation method
     * @param {string} key
     * @returns ValidationChain
     */
    static checkQuery(key: string): ValidationChain {
        return query(key);
    }

    /**
     * check if multiple paths exist
     * @param paths
     * @returns {ValidationChain}
     */
    static exist(paths: string[]): ValidationChain[] {
        let chain: ValidationChain[] = [];
        paths.forEach(path => chain.push(Validator.check(path).exists()));
        return chain;
    }

    /**
     * Body validation method
     * @param {string} key
     * @returns {ValidationChain}
     */
    static body(key?: string): ValidationChain {
        return key ? body(key) : body();
    }

    /**
     * Body validation custom method
     * @param {string} key
     * @param {string} otherKey
     * @param {string} message
     * @returns {ValidationChain}
     */
    static bodyMatch(key: string, otherKey: string, message: string): ValidationChain {
        return body(key).custom((value, {req, location, path}) => {
            if (value !== req.body[otherKey]) {
                throw new Error(message);
            } else {
                return value;
            }
        });
    }

    /**
     * Validates that a multilang field's propeties are string's
     * @param {string} field - The name of the filed
     * @returns {ValidationChain}
     */
    static multilangFieldCheck(field: string): ValidationChain {
        return Validator.check(field).custom(name => {
            let pass = true;
            Object.values(name).forEach(val => {
                if (typeof val !== "string") {
                    pass = false;
                    return;
                }
            });
            return pass;
        });
    }

    /** Sanitization Methods */
    /**
     * Main sanitize method
     * @param {string} key
     * @returns {SanitizationChain}
     */
    static sanitize(key: string) {
        return sanitize(key);
    }
    /**
     * Sanitize the body of the Request
     * @param {string} key
     * @returns {SanitizationChain}
     */
    static sanitizeBody(key: string) {
        return sanitizeBody(key);
    }
    /**
     * Sanitize the route params of the Request
     * @param {string} key
     * @returns {SanitizationChain}
     */
    static sanitizeParam(key: string) {
        return sanitizeParam(key);
    }
    /**
     * Sanitize the query string of the Request
     * @param {string} key
     * @returns {SanitizationChain}
     */
    static sanitizeQuery(key: string) {
        return sanitizeQuery(key);
    }

    /**
     * Check for errors and respond with code 422 if any are found
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    static resultOfValidation(req: Request, res: Response, next: NextFunction) {
        const errors = Validator.result(req);
        if (!errors.isEmpty()) {
            res.status(422).json(new JsonResponse().fail(errors.array()));
            return;
        }
        next();
    }

    /**
     * Extract the validation results from the provided request object
     * @param {e.Request} req
     * @returns {Result}
     */
    static result(req: Request): Result<ResponseError> {
        return validationResult(req).formatWith<ResponseError>(Validator.errorFormatter);
    }

}
