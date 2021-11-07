import { NewAble } from "@interfaces/helpers/NewAble";
export interface IModel<T = any> extends NewAble<T> {
    modelName?: string;
    className?: string;
}