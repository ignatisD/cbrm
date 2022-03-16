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

    protected _options: SMTPTransport.Options;
    protected _transport: Mail;
    protected static _instance: Mail;

    constructor(opts: IMailerOptions) {
        this._options = {
            host: opts.host,
            port: opts.port,
            secure: !!opts.secure
        };
        if (opts.user && opts.pass) {
            this._options.auth = {
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
        const transport = new Mailer(opts).transport();
        if (!this._instance) {
            this._instance = transport;
        }
        return transport;
    }

    public transport(): Mail {
        if (!this._transport) {
            this._transport = nodemailer.createTransport(this._options);
        }
        return this._transport;
    }
}
