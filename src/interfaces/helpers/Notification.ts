import IUser from "@interfaces/models/User";
import { Level } from "@helpers/Logger";

export interface INotificationAction {
    title: string;
    action: string;
    icon?: string;
}

export interface IWebNotification {
    timestamp?: number;
    title: string;
    badge?: string; // URL
    body?: string;
    data?: string;
    dir?: "auto"|"ltr"|"rtl";
    lang?: string;
    tag?: string;
    icon?: string;
    image?: string;
    click_action?: string;
    actions?: INotificationAction[];
    silent?: boolean;
    renotify?: boolean;
    requireInteraction?: boolean;
    vibrate?: number[];
}

export default interface INotification extends IWebNotification {
    type?: Level; // For color
    took?: number;
    email?: boolean;
    emailPath?: string;
    params?: any;
    // For notification target
    user?: Partial<IUser>;
    recipients?: (Partial<IUser>&{email: string})[];
    socket?: string;
    channel?: string;
}
