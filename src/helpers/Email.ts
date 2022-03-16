import * as htmlToText from "html-to-text";
import * as juice from "juice";
import Mail, { Address, Attachment, Headers } from "nodemailer/lib/mailer";
import { renderFile } from "pug";
import { JsonResponse } from "./JsonResponse";
import { EmailResponse } from "../interfaces/helpers/EmailResponse";
import { Mailer } from "./Mailer";
import { Logger } from "./Logger";

export class Email implements Mail.Options {

    /** The e-mail address of the sender. All e-mail addresses can be plain "sender@server.com" or formatted "Sender Name <sender@server.com>" */
    from: string | Address;
    /** Comma separated list or an array of recipients e-mail addresses that will appear on the To: field */
    to: Array<string | Address> = [];
    /** Comma separated list or an array of recipients e-mail addresses that will appear on the Cc: field */
    cc: Array<string | Address> = [];
    /** Comma separated list or an array of recipients e-mail addresses that will appear on the Bcc: field */
    bcc: Array<string | Address> = [];
    /** An e-mail address that will appear on the Reply-To: field */
    replyTo: string | Address;
    /** The message-id this message is replying */
    inReplyTo: string | Address;
    /** Message-id list (an array or space separated string) */
    references: string | string[];
    /** The subject of the e-mail */
    subject: string;
    /** The plaintext version of the message */
    text: string;
    /** The HTML version of the message */
    html: string;
    /** An object or array of additional header fields */
    headers: Headers;
    /** An array of attachment objects */
    attachments: Attachment[];
    /** optional Message-Id value, random value will be generated if not set */
    messageId: string;
    /** optional Date value, current UTC string will be used if not set */
    date: Date | string;
    /** optional transfer encoding for the textual parts */
    encoding: string;
    priority: "high" | "normal" | "low";

    constructor(opts?: Mail.Options) {
        if (opts) {
            const email = JSON.parse(JSON.stringify(opts));
            const body = email.message || email.html || email.text || email.altText;
            Object.assign(this, email);
            if (body) {
                this.setBody(body);
            }
        }
    }

    public formatPerson(email: string, name: string) {
        let address = `<${email.trim()}>`;
        if (name) {
            address = `${name.trim()} ${address}`;
        }
        return address;
    }

    public setFrom(email: string, name?: string) {
        this.from = this.formatPerson(email, name);
        return this;
    }

    public setTo(email: string, name?: string) {
        this.to = [this.formatPerson(email, name)];
        return this;
    }

    public setSubject(subject: string) {
        this.subject = subject;
        return this;
    }

    public addTo(email: string, name?: string) {
        this.to.push(this.formatPerson(email, name));
        return this;
    }

    public addCc(email: string, name?: string) {
        this.cc.push(this.formatPerson(email, name));
        return this;
    }

    public addBcc(email: string, name?: string) {
        this.bcc.push(this.formatPerson(email, name));
        return this;
    }

    public setBody(htmlOrText: string, isHtml: boolean = true) {
        let content = htmlOrText.trim();
        let text = htmlToText.fromString(htmlOrText, {
            wordwrap: 130,
            tables: true
        });
        if (isHtml) {
            this.html = content;
        }
        this.text = text;
        return this;
    }

    protected renderPugTemplate(path: string, data: any = {}, inlineCss: boolean = true) {
        let rendered = renderFile(path, data);
        if (inlineCss) {
            rendered = juice(rendered, {applyStyleTags: true, applyAttributesTableElements: true, applyWidthAttributes: true, preserveImportant: true});
        }
        return rendered;
    }

    public send(mailer?: Mail): Promise<JsonResponse<EmailResponse>> {
        const response = new JsonResponse<EmailResponse>();
        mailer = mailer ?? Mailer.instance();
        return mailer
            .sendMail(this)
            .then((res: EmailResponse) => {
                return response.ok(res);
            })
            .catch((e) => {
                Logger.exception(e, this);
                return response.exception(e);
            });
    }
}
