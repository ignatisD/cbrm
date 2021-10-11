import Validator from "@helpers/Validator";
import IValidatorBase, { IValidationChain } from "@interfaces/validators/ValidatorBase";
import { RequestHandler } from "express";

export default class ValidatorBase implements IValidatorBase {

    protected _requiredFields: string[] = [];
    protected _validations: IValidationChain = [];
    protected _create: IValidationChain = [];
    protected _retrieve: IValidationChain = [];
    protected _find: IValidationChain = [];
    protected _update: IValidationChain = [];
    protected _delete: IValidationChain = [];

    protected assign(instance: ValidatorBase) {
        this._requiredFields = instance._requiredFields;
        this._validations = instance._validations;
        this._create = this.required;
        this._update = this.updateRequired;
    }

    get required(): RequestHandler[]|any[] {
        return [
            ...Validator.exist(this._requiredFields),
            ...this._validations,
            Validator.resultOfValidation
        ];
    }

    get updateRequired(): RequestHandler[]|any[] {
        return [
            Validator.check("_id").isMongoId(),
            ...this._validations,
            Validator.resultOfValidation
        ];
    }

    get create() {
        return this._create;
    }
    get retrieve() {
        return this._retrieve;
    }
    get find() {
        return this._find;
    }
    get update() {
        return this._update;
    }
    get delete() {
        return this._delete;
    }
}

