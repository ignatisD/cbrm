// Interfaces
import { IJobData } from "@interfaces/common/QueuedJob";
// Helpers
import QueuedJob from "@helpers/QueuedJob";
import cronTab from "@config/cronTab";
// Business
import Business from "@business/base/Business";

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

    public static registerBusinesses() {
        // * Keep the routes sorted alphabetically
        global.businessRegistry = {
        };
    }
}
