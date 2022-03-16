import * as i18n from "i18n";
interface ExtraLanguageOptions {
    fallbackLocale: string;
    requiredLanguages: string[];
}
export const languageOptions: i18n.ConfigurationOptions & ExtraLanguageOptions = {
    // setup some locales - other locales default to en silently
    locales: ["el", "en"],
    requiredLanguages: ["el", "en"],

    // fall backs
    fallbackLocale: "en",
    fallbacks: {
        "it": "en",
        "es": "en",
        "ru": "en",
        "de": "en",
        "fr": "en"
    },

    // you may alter a site wide default locale
    defaultLocale: "el",

    // sets a custom cookie name to parse locale settings from - defaults to NULL
    cookie: "lang",

    // query parameter to switch locale (ie. /home?lang=ch) - defaults to NULL
    queryParameter: "lang",

    // where to store json files - defaults to "./locales" relative to modules directory
    directory: __dirname + "/locales",

    // controll mode on directory creation - defaults to NULL which defaults to umask of process user. Setting has no effect on win.
    // directoryPermissions: "755",

    // watch for changes in json files to reload locale on updates - defaults to false
    autoReload: false,

    // whether to write new locale information to disk - defaults to true
    // updateFiles: false,

    // sync locale information across all files - defaults to false
    // syncFiles: false,

    // what to use as the indentation unit - defaults to "\t"
    // indent: "\t",

    // setting extension of json files - defaults to ".json" (you might want to set this to ".js" according to webtranslateit)
    // extension: ".js",

    // setting prefix of json files name - default to none "" (in case you use different locale files naming scheme (webapp-en.json), rather then just en.json)
    // prefix: "webapp-",

    // enable object notation
    // objectNotation: false,

    // setting of log level DEBUG - default to require("debug")("i18n:debug")
    // logDebugFn: function (msg) {
    //     Logger.log("debug", msg);
    // },

    // setting of log level WARN - default to require("debug")("i18n:warn")
    // logWarnFn: function (msg) {
    //     Logger.log("warn", msg);
    // },

    // setting of log level ERROR - default to require("debug")("i18n:error")
    // logErrorFn: function (msg) {
    //     Logger.log("error", msg);
    // },

    // object or [obj1, obj2] to bind the i18n api and current locale to - defaults to null
    // register: global,

    // hash to specify different aliases for i18n"s internal methods to apply on the request/response objects (method -> alias).
    // note that this will *not* overwrite existing properties with the same name
    // api: {
    //     "__": "t",  //now req.__ becomes req.t
    //     "__n": "tn" //and req.__n can be called as req.tn
    // },

    // Downcase locale when passed on queryParam; e.g. lang=en-US becomes
    // en-us.  When set to false, the queryParam value will be used as passed;
    // e.g. lang=en-US remains en-US.
    preserveLegacyCase: true
};
