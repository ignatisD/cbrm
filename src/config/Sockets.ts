import INotification from "@interfaces/helpers/Notification";

export default class Sockets {

    public static init() {
        // ...sockets implementation
    }

    public static notify(channel: string, notification: INotification): void {
        // notify
        Log.info(channel, notification);
    }
}
