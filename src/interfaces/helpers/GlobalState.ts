import { NewAble } from "./NewAble";
import { IBusinessLike } from "../business/BusinessLike";

export interface GlobalState {
    ServerRoot: string;
    ViewsRoot: string;
    jwtOptions: any;
    languages: string[];
    requiredLanguages: string[];
    defaultLanguage: string;
    fallbackLanguage: string;
    envFile: string;
    prefix: string;
    isDevMode: boolean;
    isWorker: boolean;
    isMainWorker: boolean;
    disableTransactions: boolean;
    pagingLimit: number;
    API: string;
    Redis: any;
    renderHTML: (view: string, params?: any) => string;
    businessRegistry: { [key: string]: NewAble<IBusinessLike> };
    buildNumber: string;
}
