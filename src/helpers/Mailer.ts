import * as nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export interface IMailerOptions {
    host: string;
    port: number;
    secure?: boolean;
    user?: string;
    pass?: string;
}
export class Mailer {

    protected options: SMTPTransport.Options;

    constructor(opts: IMailerOptions) {
        this.options = {
            host: opts.host,
            port: opts.port,
            secure: !!opts.secure
        };
        if (opts.user && opts.pass) {
            this.options.auth = {
                type: "LOGIN",
                user: opts.user,
                pass: opts.pass
            };
        }
    }

    public static setup(opts: IMailerOptions): Mail {
        const mailer = new Mailer(opts);
        return nodemailer.createTransport(mailer.options);
    }
}
