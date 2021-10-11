export default interface IPricing {
    id?: string;
    type?: string;
    count?: number;
    amount: number;
    amountInEuro: number;
    currency: string;
    includesTax?: boolean;
    paxAge?: number;
    paxCount?: number;
    perPassenger?: IPricing[];
    taxItems?: IPricing[];
}
