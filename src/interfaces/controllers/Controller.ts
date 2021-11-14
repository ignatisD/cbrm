import IBusinessLike, { IBusinessRegistry } from "../business/BusinessLike";

export default interface IController<T extends IBusinessLike = IBusinessLike> {
    registry(): IBusinessRegistry<T>;
}
