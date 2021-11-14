import IController from "./Controller";
import IReadController from "./ReadController";
import IWriteController from "./WriteController";
import IBusinessBase from "../business/BusinessBase";
import { IPopulate } from "../helpers/Query";

export default interface IControllerBase extends IController, IReadController, IWriteController {
    model?: string;
}
export type ControllerMethodsPopulates = Record<keyof Pick<IBusinessBase, "retrieve"|"find"|"findById"|"findOne">, IPopulate[]|string[]>;
