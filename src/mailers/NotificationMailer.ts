import * as moment from "moment";
import Email from "../helpers/Email";
import Mail from "nodemailer/lib/mailer";
import INotification from "../interfaces/helpers/Notification";
import JsonResponse from "../helpers/JsonResponse";
import { INotifier } from "../interfaces/helpers/Notifier";
import { EmailResponse } from "../interfaces/helpers/EmailResponse";
import Helpers from "../helpers/Helpers";

export default class NotificationMailer extends Email implements INotifier {
    private _basePath = global.ViewsRoot + "/";
    constructor(opts?: Mail.Options) {
        super(opts);
    }

    public async notify(notification: INotification) {
        const response = new JsonResponse<EmailResponse>();
        try {
            if (!notification.user?.email && !notification.recipients?.length) {
                Log.error("Notification user not found or no email given", {title: notification.title});
                return response.error("User is required for notification");
            }
            const emailPath = notification.emailPath || this._basePath + "/notification.pug";
            const template = Helpers.renderPugTemplate(emailPath, {
                ...notification,
                moment: moment
            }, true);

            this.setFrom(process.env.EMAIL_FROM, process.env.EMAIL_FROM_NAME);
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

            return this.send(false);
        } catch (e) {
            Log.exception(e, {user: notification?.user});
            return response.exception(e);
        }
    }
}
