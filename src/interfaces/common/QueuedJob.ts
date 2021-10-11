import IUser from "@interfaces/models/User";
import { Tube } from "@helpers/Tubes";
import INotification from "@interfaces/helpers/Notification";

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
    businessTube?: Tube;
    notification?: INotification;
    attempts?: number;
}

export interface IQueuedJob extends IJobData {
    // required
    business: string;
    method: string;
    inputs: any[];
    tube: Tube;
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
