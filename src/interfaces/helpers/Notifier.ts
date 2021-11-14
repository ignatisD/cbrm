import INotification from "./Notification";
import IResponse from "./Response";

export interface INotifier {
    send: () => Promise<IResponse>;
    notify: (notification: INotification) => Promise<IResponse>;
}
