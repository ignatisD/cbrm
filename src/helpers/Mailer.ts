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
    protected static _instance: Mail;

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

    public static instance() {
        return this._instance;
    }

    public static setup(opts: IMailerOptions): Mail {
        const mailer = new Mailer(opts);
        this._instance = nodemailer.createTransport(mailer.options);
        return this._instance;
    }
}
