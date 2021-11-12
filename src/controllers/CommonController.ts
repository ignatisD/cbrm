import CommonBusiness from "@business/CommonBusiness";
import Controller from "@controllers/base/Controller";
import { Request, Response } from "express";
import JsonResponse from "@helpers/JsonResponse";

export default class CommonController extends Controller<CommonBusiness> {

    constructor() {
        super(CommonBusiness);
    }

    async testQueues(req: Request, res: Response) {
        try {
            const result = await this.business(req).testQueues();
            res.json(result);
        } catch (e) {
            this.exception(req, e, "testQueues");
            res.status(500).json(JsonResponse.caught(e));
        }
    }
}