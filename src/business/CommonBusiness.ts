// Interfaces
import { IJobData } from "@interfaces/common/QueuedJob";
import { Options } from "nodemailer/lib/mailer";
// Helpers
import QueuedJob from "@helpers/QueuedJob";
import cronTab from "@config/cronTab";
// Business
import Business from "@business/base/Business";
import Email from "@helpers/Email";
import JsonResponse from "@helpers/JsonResponse";

export default class CommonBusiness extends Business {

    constructor() {
        super();
    }

    public static cron() {
        Object.keys(cronTab).forEach(pattern => {
            const jobs: IJobData[] = cronTab[pattern];
            jobs.forEach(job => {
                const q = new QueuedJob(job.business);
                q.setup(job.method, job.inputs);
                const res = q.fireCron(pattern);
                Log.info(res.get());
            });
        });
    }

    public async testQueues() {
        const emailOptions: Options = {
            from: "root@drakoulas.gr",
            to: "ignatios@drakoulas.gr",
            subject: "Test email",
            html: "<h1>Hello World!</h1>"
        };
        return this.queue()
            .setup("notifyEmail", [emailOptions])
            .later(20000)
            .fire();
    }

    public async notifyEmail(emailOptions: Options) {
        try {
            const email = new Email(emailOptions);
            return await email.send();
        } catch (e) {
            this.exception(e, "notifyEmail");
            return JsonResponse.caught(e);
        }
    }
}
