import { Options } from "nodemailer/lib/mailer";
import { Business } from "../../src";
import { Email } from "../../src";
import { JsonResponse } from "../../src";
import { StateManager } from "../../src";
import { MyGlobalState } from "../TestServer";

export class ApplicationBusiness extends Business {

    protected _global: StateManager<MyGlobalState>;

    constructor() {
        super();
        this._global = StateManager.instance<MyGlobalState>();
    }

    public async testQueues() {
        const emailOptions: Options = {
            from: "ignatios@drakoulas.gr",
            to: this._global.get("applicationEmail", process.env.APPLICATION_EMAIL),
            subject: "Test email from Queue",
            html: "<h1>Hello Queue!</h1>"
        };
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
