import IController from "@interfaces/controllers/base/Controller";
import IReadController from "@interfaces/controllers/common/ReadController";
import IWriteController from "@interfaces/controllers/common/WriteController";
import IBusinessBase from "@interfaces/business/BusinessBase";
import { IPopulate } from "@interfaces/helpers/SearchTerms";

export default interface IControllerBase extends IController, IReadController, IWriteController {
    model?: string;
}
export type ControllerMethodsPopulates = Record<keyof Pick<IBusinessBase, "retrieve"|"find"|"findById"|"findOne">, IPopulate[]|string[]>;
