
export interface EmailResponse {
    /**
     * most transports should return the final Message-Id value used with this property
     */
    messageId: string;
    messageTime?: number;
    messageSize?: number;
    /**
     * includes the envelope object for the message
     */
    envelope: any;
    envelopeTime?: number;
    /**
     * is an array returned by SMTP transports (includes recipient addresses that were accepted by the server)
     */
    accepted: string[];
    /**
     * is an array returned by SMTP transports (includes recipient addresses that were rejected by the server)
     */
    rejected: string[];
    /**
     * is an array returned by Direct SMTP transport. Includes recipient addresses that were temporarily rejected together with the server response
     */
    pending?: string[];
    /**
     * is a string returned by SMTP transports and includes the last SMTP response from the server
     */
    response: string;
}