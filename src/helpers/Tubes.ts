export enum Tubes {
    SOLO = "SOLO",
    CRON = "CRON",
    SCROLL = "SCROLL",
    LAZY = "LAZY",
    NORMAL = "NORMAL",
    QUICK = "QUICK"
}

export type Tube = keyof typeof Tubes;
