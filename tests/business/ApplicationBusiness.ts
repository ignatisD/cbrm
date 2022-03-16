import { Options } from "nodemailer/lib/mailer";
import { Business } from "../../src";
import { Email } from "../../src";
import { JsonResponse } from "../../src";

export class ApplicationBusiness extends Business {

    constructor() {
        super();
    }

    public async testQueues(emailOptions: Options) {
        return this.queue()
            .setup("notifyEmail", [emailOptions])
            .later(20000)
            .fire();
    }

    public async notifyEmail(emailOptions: Options) {
        try {
            // Logger.info(emailOptions);
            const email = new Email(emailOptions);
            return await email.send();
        } catch (e) {
            this.exception(e, "notifyEmail");
            return JsonResponse.caught(e);
        }
    }
}
