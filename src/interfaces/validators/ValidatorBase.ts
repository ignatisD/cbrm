import { RequestHandler } from "express";

export type IValidationChain = (RequestHandler|RequestHandler[])[];

export default interface IValidatorBase {
    required: IValidationChain;
    create: IValidationChain;
    retrieve: IValidationChain;
    find: IValidationChain;
    update: IValidationChain;
    delete: IValidationChain;
}
