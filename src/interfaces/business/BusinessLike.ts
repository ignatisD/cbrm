import { Job } from "bull";
import { Request } from "express";
import INotification from "@interfaces/helpers/Notification";
import { Tube } from "@helpers/Tubes";
import { IRequestMetadata } from "@interfaces/helpers/SearchTerms";

export default interface IBusinessLike {
    debug: any;
    modelName: string;
    uniqueId: string;
    job: Job;
    tube: Tube;
    nextTube: Tube;
    token: string;
    locale: string;
    user: any;
    meta?: IRequestMetadata;
    addToken: (token: string) => this;
    addMeta: (token: IRequestMetadata) => this;
    addUser: (user: any, socket?: string|string[]) => this;
    addUniqueId: (uniqueId: string) => this;
    addSocket: (socket?: string|string[]) => this;
    addJob: (job?: Job) => this;
    setLocale: (locale: string) => this;
    fromRequest: (req?: Request) => this;
    notifyUser: (notification: INotification) => this;
    progress: (percentage: number) => any;
    addTransaction: (session: any) => void;
    exception: (...args: any) => void;
}

export interface IBusinessRegistry<T extends IBusinessLike> {
    name: string;
    business: new() => T;
}
