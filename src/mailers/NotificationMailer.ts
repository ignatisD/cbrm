import path from "path";
import * as moment from "moment";
import { Email } from "../helpers/Email";
import Mail from "nodemailer/lib/mailer";
import { INotification } from "../interfaces/helpers/Notification";
import { JsonResponse } from "../helpers/JsonResponse";
import { INotifier } from "../interfaces/helpers/Notifier";
import { EmailResponse } from "../interfaces/helpers/EmailResponse";
import { Helpers } from "../helpers/Helpers";
import { Logger } from "../helpers/Logger";
import { Configuration } from "../helpers/Configuration";

export class NotificationMailer extends Email implements INotifier {
    protected _basePath: string;
    constructor(opts?: Mail.Options) {
        super(opts);
        this._basePath = path.join(Configuration.get("ViewsRoot", __dirname),  "/");
    }

    public async notify(notification: INotification) {
        const response = new JsonResponse<EmailResponse>();
        try {
            if (!notification.user?.email && !notification.recipients?.length) {
                Logger.error("Notification user not found or no email given", {title: notification.title});
                return response.error("User is required for notification");
            }
            const emailPath = notification.emailPath || path.join(this._basePath, "/notification.pug");
            const template = Helpers.renderPugTemplate(emailPath, {
                ...notification,
                moment: moment
            }, true);
            const from = notification.params?.from || Configuration.get("appEmail");
            const fromName = notification.params?.fromName || Configuration.get("appName");
            this.setFrom(from, fromName);
            if (notification.user) {
                this.setTo(notification.user.email, notification.user.fullName);
            }
            if (notification.recipients?.length) {
                notification.recipients.forEach(rec => {
                    this.addTo(rec.email, rec.fullName);
                });
            }
            this.setBody(template, true);
            this.setSubject(notification.title);

            return this.send();
        } catch (e) {
            Logger.exception(e, {user: notification?.user});
            return response.exception(e);
        }
    }
}
