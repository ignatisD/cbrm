import IBaseRoutes from "@interfaces/routes/BaseRoutes";
import IRoute from "@interfaces/common/Route";
import CommonController from "@controllers/CommonController";

export default class CommonRoutes implements IBaseRoutes {
    public ctrl: CommonController;
    constructor() {
        this.ctrl = new CommonController();
    }

    public routes(): IRoute[] {
        return [
            {
                name: "Test Queues and email",
                path: "/test",
                verb: "all",
                method: "testQueues",
                ctrl: this.ctrl
            },
        ];
    }
}