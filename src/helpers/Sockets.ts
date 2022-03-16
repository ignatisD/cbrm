import { INotification } from "../interfaces/helpers/Notification";
import { Logger } from "./Logger";

export class Sockets {

    public static init() {
        // ...sockets implementation
    }

    public static notify(channel: string, notification: INotification): void {
        // notify
        Logger.info(channel, notification);
    }
}
