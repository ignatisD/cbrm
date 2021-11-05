import IBusinessBase from "@interfaces/business/BusinessBase";
import { ISearchTerms } from "@interfaces/helpers/SearchTerms";
import { IEsDoc, IEsMappingBody, MappingMode } from "@interfaces/models/base/EsModel";
import { IEsWriteResponse, RefreshCommand } from "@interfaces/helpers/Elastic";
import Business from "@business/base/Business";
import ElasticRepositoryBase from "@repository/base/ElasticRepositoryBase";
import JsonResponse from "@helpers/JsonResponse";
import IPaginatedResults from "@interfaces/helpers/PaginatedResults";
import { IMappingResponse } from "@interfaces/helpers/Mapping";
import Pagination from "@helpers/Pagination";

export default class ElasticBusinessBase<T extends IEsDoc> extends Business<T> implements IBusinessBase<T> {

    public took: number = 0;
    public total: number = 0;
    protected _repo: ElasticRepositoryBase;

    protected constructor(repo: ElasticRepositoryBase) {
        super(repo);
    }

    public get today() {
        return this._repo.today;
    }

    /**
     * ! Used for Debug
     */
    public get repo() {
        return this._repo;
    }

    public debugTerms(terms: ISearchTerms): any {
        return this._repo.build(terms);
    }

    public getMapping(): IMappingResponse {
        return this._repo.mapping();
    }

    /**
     * Tested
     */
    public async ensureMapping(mode: MappingMode = MappingMode.ALL): Promise<JsonResponse<IEsMappingBody>> {
        return await this._repo.ensureMapping(mode);
    }

    /**
     * Tested
     * @param item
     * @param refresh
     */
    public async create(item: T, refresh: RefreshCommand = false): Promise<JsonResponse<IEsWriteResponse<T>>> {
        return await this._repo.create(item, refresh);
    }

    /**
     * Tested
     * @param refresh
     * @param items
     */
    public async createMany(items: T[], refresh: RefreshCommand = false): Promise<JsonResponse<IEsWriteResponse<T>[]>> {
        return await this._repo.createMany(items, refresh);
    }

    /**
     * Tested
     * @param item
     * @param refresh
     */
    public async updateOrCreate(item: Partial<T>, refresh: RefreshCommand = false): Promise<JsonResponse<IEsWriteResponse<T>>> {
        return await this._repo.updateOrCreate(item, refresh);
    }

    /**
     * Tested
     * @param items
     * @param refresh
     */
    public async updateOrCreateMany(items: Partial<T>[], refresh: RefreshCommand = false): Promise<JsonResponse<IEsWriteResponse<T>[]>> {
        return await this._repo.updateOrCreateMany(items, refresh);
    }

    /**
     * Tested
     * @param searchTerms
     */
    public async search(searchTerms: ISearchTerms): Promise<IPaginatedResults<T>> {
        const response = await this._repo.search(searchTerms);
        this._debug = response?.debug;
        this.took = response?.took;
        return response.get() ?? new Pagination().setDebug(response.debug, response.errors);
    }
    /**
     * Tested
     * @param searchTerms
     */
    public async retrieve(searchTerms: ISearchTerms): Promise<IPaginatedResults<T>> {
        return await this.search(searchTerms);
    }
    /**
     * Tested
     * @param searchTerms
     */
    public async find(searchTerms: ISearchTerms): Promise<T[]> {
        searchTerms.setPaging(1, 10000);
        const response = await this.search(searchTerms);
        this._debug = response?.debug;
        this.took = response?.took;
        this.total = response?.total;
        return response?.docs || [];
    }

    /**
     * Tested
     * @param searchTerms
     */
    public async findById(searchTerms: ISearchTerms): Promise<T> {
        searchTerms.setFilter("_id", searchTerms.id);
        const response = await this._repo.findById(searchTerms);
        this.took = this._repo.took();
        this._debug = response?.debug;
        return response.get() || null;
    }

    /**
     * Tested
     * @param searchTerms
     */
    public async findOne(searchTerms: ISearchTerms): Promise<T> {
        if (searchTerms.id) {
            return await this.findById(searchTerms);
        } else {
            const response = await this._repo.findOne(searchTerms);
            this._debug = response?.debug;
            this.took = this._repo.took();
            return response.get() || null;
        }
    }

    /**
     * Tested
     * @param _id
     * @param item
     * @param refresh
     */
    public async update(_id: string, item: Partial<T>, refresh: RefreshCommand = false): Promise<JsonResponse<T>>  {
        return await this._repo.updateOne(_id, item, refresh);
    }
    /**
     * Tested
     * @param terms
     * @param item
     */
    public async updateMany(terms: ISearchTerms, item: Partial<T>|any): Promise<JsonResponse<number>> {
        return await this._repo.updateMany(terms, item);
    }
    /**
     * Tested
     * @param items
     * @param refresh
     */
    public async updateManyWithDifferentValues(items: Partial<T>[], refresh: RefreshCommand = false): Promise<JsonResponse<IEsWriteResponse<T>[]>> {
        return await this._repo.updateManyWithDifferentValues(items, refresh);
    }

    /**
     * Tested
     * @param _id
     * @param index
     * @param refresh
     */
    public async delete(_id: string, index?: string, refresh: RefreshCommand = false): Promise<JsonResponse<IEsWriteResponse<T>>> {
        return await this._repo.deleteById(_id, index, refresh);
    }

    /**
     * Tested
     * @param terms
     */
    public async deleteMany(terms: ISearchTerms): Promise<JsonResponse<number>> {
        return await this._repo.deleteMany(terms);
    }

    /**
     * Tested - Custom method
     * @param items
     * @param refresh
     */
    public async deleteBulk(items: Partial<T>[], refresh: RefreshCommand = false): Promise<JsonResponse<IEsWriteResponse<T>[]>> {
        return await this._repo.deleteBulk(items, refresh);
    }

    /**
     * Tested
     * @param searchTerms
     */
    public async count(searchTerms: ISearchTerms): Promise<number> {
        const response = await this._repo.count(searchTerms);
        this._debug = response?.debug;
        return response.get() || 0;
    }

    /**
     * ! Not implemented
     * @param id
     */
    public async restore(id: string): Promise<JsonResponse> {
        return Promise.resolve(JsonResponse.notImplemented());
    }

    /**
     * ! Not implemented
     * @param searchTerms
     */
    public async duplicate(searchTerms: ISearchTerms): Promise<JsonResponse> {
        return Promise.resolve(JsonResponse.notImplemented());
    }

}
