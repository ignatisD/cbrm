import IBusinessLike, { IBusinessRegistry } from "@interfaces/business/BusinessLike";

export default interface IController<T extends IBusinessLike = IBusinessLike> {
    registry(): IBusinessRegistry<T>;
}
