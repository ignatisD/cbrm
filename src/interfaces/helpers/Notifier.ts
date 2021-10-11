import INotification from "@interfaces/helpers/Notification";
import IResponse from "./base/Response";

export interface INotifier {
    send: () => Promise<IResponse>;
    notify: (notification: INotification) => Promise<IResponse>;
}
