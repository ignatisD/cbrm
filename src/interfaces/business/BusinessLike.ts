import { Job } from "bull";
import { Request } from "express";
import INotification from "../helpers/Notification";
import { IRequestMetadata } from "../helpers/Query";

export default interface IBusinessLike {
    debug: any;
    modelName: string;
    uniqueId: string;
    job: Job;
    tube: string;
    nextTube: string;
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
    populate: (docs: any, st: any) => any;
}

export interface IBusinessRegistry<T extends IBusinessLike> {
    name: string;
    business: new() => T;
}
