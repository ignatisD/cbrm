import { Request, Response } from "express";
import IControllerBase, { ControllerMethodsPopulates } from "../interfaces/controllers/ControllerBase";
import IBusinessBase from "../interfaces/business/BusinessBase";
import { MappingMode } from "../interfaces/helpers/Mapping";
import { IPopulate, IQuery } from "../interfaces/helpers/Query";
import JsonResponse from "../helpers/JsonResponse";
import Query from "../helpers/Query";
import Controller from "../controllers/Controller";
import Logger from "../helpers/Logger";

export default abstract class ControllerBase<C extends IBusinessBase> extends Controller<C> implements IControllerBase {

    protected _methodPopulates: Partial<ControllerMethodsPopulates>;

    protected constructor(business: new() => C, name: string = "data", plural: string = "data") {
        super(business, name, plural);
        this._methodPopulates = {};
    }

    async retrieve(req: Request, res: Response): Promise<void> {
        try {
            const searchTerms = Query.fromRequest(req);
            this._applyPopulates("retrieve", searchTerms);
            const data = await this.business(req).retrieve(searchTerms);
            res.json(new JsonResponse().ok(data, this._namePlural));
        } catch (e)  {
            Logger.exception(e, this.reqUser(req));
            res.status(500).json(new JsonResponse().exception(e));
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const response = await this.business(req).create(req.body);
            res.json(response);
        } catch (e)  {
            Logger.exception(e, this.reqUser(req));
            res.status(500).json(new JsonResponse().exception(e));
        }
    }

    async createMany(req: Request, res: Response): Promise<void> {
        try {
            const response = await this.business(req).createMany(req.body);
            res.json(response);
        } catch (e)  {
            Logger.exception(e, this.reqUser(req));
            res.status(500).json(new JsonResponse().exception(e));
        }
    }

    async find(req: Request, res: Response): Promise<void> {
        try {
            const searchTerms = Query.fromRequest(req);
            this._applyPopulates("find", searchTerms);
            const data = await this.business(req).find(searchTerms);
            res.json(new JsonResponse().ok(data, this._name));
        } catch (e)  {
            Logger.exception(e, this.reqUser(req));
            res.status(500).json(new JsonResponse().exception(e));
        }
    }

    async findById(req: Request, res: Response): Promise<void> {
        try {
            const searchTerms = Query.fromRequest(req).setId(req.params._id);
            this._applyPopulates("findById", searchTerms);
            const data = await this.business(req).findById(searchTerms);
            res.json(new JsonResponse().ok(data, this._name));
        } catch (e)  {
            Logger.exception(e, this.reqUser(req));
            res.status(500).json(new JsonResponse().exception(e));
        }
    }

    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const searchTerms = Query.fromRequest(req).setId(req.params._id);
            this._applyPopulates("findOne", searchTerms);
            const data = await this.business(req).findOne(searchTerms);
            res.json(new JsonResponse().ok(data, this._name));
        } catch (e)  {
            Logger.exception(e, this.reqUser(req));
            res.status(500).json(new JsonResponse().exception(e));
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const response = await this.business(req).update(req.params._id, req.body);
            res.json(response);
        } catch (e)  {
            Logger.exception(e, this.reqUser(req));
            res.status(500).json(new JsonResponse().exception(e));
        }
    }

    async updateManyWithDifferentValues(req: Request, res: Response): Promise<void> {
        try {
            const response = await this.business(req).updateManyWithDifferentValues(req.body);
            res.json(response);
        } catch (e)  {
            Logger.exception(e, this.reqUser(req));
            res.status(500).json(new JsonResponse().exception(e));
        }
    }

    async updateMany(req: Request, res: Response): Promise<void> {
        try {
            const props = req.body.props;
            delete req.body.props;
            const searchTerms = Query.fromScratch().setFilters(req.body.filters);
            const response = await this.business(req).updateMany(searchTerms, props);
            res.json(response);
        } catch (e)  {
            Logger.exception(e, this.reqUser(req));
            res.status(500).json(new JsonResponse().exception(e));
        }
    }

    async delete(req: Request, res: Response): Promise<void> {
        const response = new JsonResponse();
        try {
            const result: boolean = await this.business(req).delete(req.params._id, !req.query.force);
            res.json(response.ok(result, "deleted"));
        } catch (e)  {
            Logger.exception(e, this.reqUser(req));
            res.status(500).json(response.exception(e));
        }
    }

    async deleteMany(req: Request, res: Response): Promise<void> {
        try {
            const searchTerms = Query.fromRequest(req);
            const data = await this.business(req).deleteMany(searchTerms);
            res.json(new JsonResponse().ok(data, this._namePlural));
        } catch (e)  {
            Logger.exception(e, this.reqUser(req));
            res.status(500).json(new JsonResponse().exception(e));
        }
    }

    async deleteManyById(req: Request, res: Response): Promise<void> {
        const response = new JsonResponse();
        try {
            const searchTerms = Query.fromScratch().setFilter("_id", req.body);
            const result: number = await this.business(req).deleteMany(searchTerms);
            res.json(response.ok(result, "deleted"));
        } catch (e)  {
            Logger.exception(e, this.reqUser(req));
            res.status(500).json(response.exception(e));
        }
    }

    async duplicate(req: Request, res: Response): Promise<void> {
        try {
            const searchTerms = Query.fromRequest(req);
            searchTerms.setId(req.params._id);
            searchTerms.setLean(true);

            const response = await this.business(req).duplicate(searchTerms);
            res.json(new JsonResponse().ok(response, this._name));
        } catch (e)  {
            Logger.exception(e, this.reqUser(req));
            res.status(500).json(new JsonResponse().exception(e));
        }
    }

    async restore(req: Request, res: Response): Promise<void> {
        try {
            const data = await this.business(req).restore(req.params._id);
            res.json(new JsonResponse().ok(data, this._name));
        } catch (e)  {
            Logger.exception(e, this.reqUser(req));
            res.status(500).json(new JsonResponse().exception(e));
        }
    }

    async mapping(req: Request, res: Response): Promise<void> {
        try {
            const data = this.business(req).getMapping();
            res.json(new JsonResponse().ok(data, this._name));
        } catch (e)  {
            Logger.exception(e, this.reqUser(req));
            res.status(500).json(new JsonResponse().exception(e));
        }
    }

    async count (req: Request, res: Response): Promise<void> {
        try {
            const searchTerms = Query.fromRequest(req);
            const data = await this.business(req).count(searchTerms);
            res.json(new JsonResponse().ok(data, this._namePlural));
        } catch (e)  {
            Logger.exception(e, this.reqUser(req));
            res.status(500).json(new JsonResponse().exception(e));
        }
    }

    async ensureMapping(req: Request, res: Response): Promise<void> {
        try {
            let mode = MappingMode.ALL;
            if (req.query.mode) {
                const inputMode = parseInt(req.query.mode.toString(), 10);
                if (inputMode === MappingMode.ALL || inputMode === MappingMode.MAPPING || inputMode === MappingMode.TEMPLATE) {
                    mode = inputMode;
                }
            }
            const response = await this.business(req).ensureMapping(mode);
            res.json(response);
        } catch (e) {
            Logger.exception(e, this.reqUser(req));
            res.status(500).json(JsonResponse.caught(e));
        }
    }

    protected _setMethodPopulates(methods: (keyof ControllerMethodsPopulates)[]|keyof ControllerMethodsPopulates, populates: IPopulate[]|string[]) {
        if (!Array.isArray(methods)) {
            methods = [methods];
        }

        for (const method of methods) {
            this._methodPopulates[method] = populates;
        }
    }

    protected _applyPopulates(method: keyof ControllerMethodsPopulates, terms: IQuery) {
        if (!terms.options.populate?.length && this._methodPopulates[method]?.length) {
            terms.populate(this._methodPopulates[method]);
        }
    }
}
