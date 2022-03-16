import { IBusinessLike, IBusinessRegistry } from "../business/BusinessLike";

export interface IController<T extends IBusinessLike = IBusinessLike> {
    registry(): IBusinessRegistry<T>;
}
