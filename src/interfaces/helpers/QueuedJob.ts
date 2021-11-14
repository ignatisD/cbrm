import IUser from "../models/User";
import INotification from "./Notification";

export interface IJobData {
    title?: string;
    business: string;
    method: string;
    inputs: any[];
    instance?: boolean;
    user?: Partial<IUser>;
    socket?: string;
    uniqueId?: string;
    token?: string;
    businessTube?: string;
    notification?: INotification;
    attempts?: number;
}

export interface IQueuedJob extends IJobData {
    // required
    business: string;
    method: string;
    inputs: any[];
    tube: string;
    api: string;
    // optional
    instance?: boolean;
    title?: string;
    delay?: number;
    priority?: number;
    onComplete?: IQueuedJob;

    getTitle: () => string;
    getData: (withInputs: boolean) => Partial<IJobData>;
}

export type CronTab = Record<string, IJobData[]>;
