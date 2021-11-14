// Interfaces
import { IJobData } from "../interfaces/helpers/QueuedJob";
// Helpers
import QueuedJob from "../helpers/QueuedJob";
import Logger from "../helpers/Logger";
import cronTab from "../config/cronTab";
// Business
import Business from "../business/Business";

export default class ApplicationBusiness extends Business {

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
                Logger.info(res.get());
            });
        });
    }
}
