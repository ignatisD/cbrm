export interface IMultilingual {
    el?: string;
    en?: string;
    [lang: string]: string;
}

export interface IExtraLanguageOptions {
    fallbackLocale?: string;
    requiredLanguages?: string[];
}
