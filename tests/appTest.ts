import { Authenticator } from "../src";
import { TestServer } from "./TestServer";
import { languageOptions } from "./config/testLanguageOptions";

TestServer.setAuthenticator(Authenticator);
TestServer.bootstrap({
    apiName: "test",
    envFile: ".env.test",
    languageOptions: languageOptions,
    queues: true
});
