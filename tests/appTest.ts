import { Authenticator, Configuration } from "../src";
import { MyConfiguration, TestServer } from "./TestServer";
import { languageOptions } from "./config/testLanguageOptions";

TestServer.setAuthenticator(Authenticator);
const configuration = Configuration.instance<MyConfiguration>().setup({
    apiName: "test",
    envFile: ".env.test",
    languageOptions: languageOptions,
    queues: true
});
TestServer.bootstrap(configuration);
