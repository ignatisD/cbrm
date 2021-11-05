import IBusinessBase from "@interfaces/business/BusinessBase";
import { IPopulate, ISearchTerms } from "@interfaces/helpers/SearchTerms";
import IPaginatedResults from "@interfaces/helpers/PaginatedResults";
import { Doc } from "@interfaces/models/base/ModelBase";
import Business from "@business/base/Business";
import MongooseRepositoryBase from "@repository/base/MongooseRepositoryBase";
import JsonResponse from "@helpers/JsonResponse";
import { IBulkWriteOpResultObject } from "@interfaces/helpers/BulkWriteResponse";
import Holder from "@helpers/Holder";

/**
 * Type Safe Base class for all Business Logic
 * Most of the methods are self explanatory and have signatures that show
 * the appropriate input and output
 *
 * This class should be extended pointing to an Interface <T>
 * which denotes the model this business is responsible for
 */
export default class MongooseBusinessBase<T> extends Business<T> implements IBusinessBase<T> {

    /**
     * The repository linked with this business
     */
    protected _repo: MongooseRepositoryBase;

    protected _skipEnrich: boolean = false;

    /**
     * The business constructor
     * As you can see it is a protected constructor, which, in turn, means
     * you cannot retrieve an instance of this base class
     * @param repo
     * @protected
     */
    protected constructor(repo: MongooseRepositoryBase) {
        super(repo);
    }

    /**
     * Uses the create index method and will be used in the future to update indexes on models manually and not on every restart
     */
    public async ensureMapping(mode?: any): Promise<JsonResponse> {
        if (mode) {
            Log.warning("Mapping mode is not supported for MongoDB models");
        }
        await this._repo.ensureMapping();
        return new JsonResponse().ok(true);
    }

    /**
     * Method to insert multiple documents that have an _id already assigned
     * Caution! Does not trigger save middleware
     * Transaction Capable (and ready)
     * ! Warning! It returns a typed {@link JsonResponse}
     * @param docs
     * @param options
     */
    public async insertMany(docs: Partial<T>[], options?: { ordered?: boolean, rawResult?: boolean }): Promise<JsonResponse<T[]>> {
        const response = this._response<T[]>();
        try {
            if (!docs || !docs.length) {
                return response.ok([]);
            }
            const result: T[] = await this._repo.insertMany(docs, options);
            return response.ok(result);
        } catch (e) {
            Log.exception(e, this.businessUser);
            return response.exception(e);
        }
    }

    /**
     * Method to create a single document
     * ! Warning! It returns a typed {@link JsonResponse}
     * @param item
     */
    public async create(item: Partial<T> | any): Promise<JsonResponse<Doc<T>>> {
        const response = this._response();
        try {
            const data = this._skipEnrich ? item : this._enrichWithUser(item);
            const model = await this._repo.create(data);
            return response.ok(model);
        } catch (e) {
            Log.exception(e, this.businessUser);
            return response.exception(e);
        }
    }

    /**
     * Method to create an array of documents
     * ! Warning! It returns a typed {@link JsonResponse}
     * @param items
     */
    public async createMany(items: (Partial<T> | any)[]): Promise<JsonResponse<Doc<T>[]>> {
        const response = this._response<Doc<T>[]>();
        try {
            if (!items || !items.length) {
                return response.ok([]);
            }
            const data = this._skipEnrich ? items : this._enrichWithUser(items);
            const models = await this._repo.createMany(data);
            return response.ok(models);
        } catch (e) {
            Log.exception(e, this.businessUser);
            return response.exception(e);
        }
    }

    /**
     * Method to find the distinct values of the provided fields in the filtered docs
     * @param field
     * @param searchTerms
     */
    public async distinct(field: keyof T, searchTerms: ISearchTerms) {
        return await this._repo.distinct(field, searchTerms);
    }

    /**
     * Count the docs based on the {@link ISearchTerms}
     * @param searchTerms
     */
    public async count(searchTerms: ISearchTerms): Promise<number> {
        return await this._repo.count(searchTerms);
    }

    public async populate<T>(docs: T[], st: ISearchTerms): Promise<T[]>;
    public async populate<T>(docs: T, st: ISearchTerms): Promise<T>;
    public async populate<T>(docs: T[] | T, st: ISearchTerms) {
        st.token = this._token;
        return await this._repo.populate(docs, st);
    }

    /**
     * Returns the documents matching some optional filters ({@link SearchTerms})
     * These result are paginated and can be populated instances ({@link IPopulate})
     * or partials of the actual interface (using projection)
     * ! Warning! This method is not transaction aware.
     * If you want to retrieve records that are part of a running transaction, then use {@link find} instead
     * @param searchTerms
     */
    public async retrieve(searchTerms: ISearchTerms): Promise<IPaginatedResults<Doc<T>>> {
        return await this._repo.retrieve(searchTerms);
    }

    /**
     * This method is an alias for retrieve
     * @param searchTerms
     */
    public async search(searchTerms: ISearchTerms): Promise<IPaginatedResults<Doc<T>>> {
        return await this._repo.retrieve(searchTerms);
    }

    /**
     * Returns the documents matching some optional filters ({@link SearchTerms})
     * These result can be populated instances ({@link IPopulate})
     * or partials of the actual interface (using projection)
     * Also, this method is transaction aware
     * @param searchTerms
     */
    public async find(searchTerms: ISearchTerms): Promise<Doc<T>[]> {
        return await this._repo.find(searchTerms);
    }

    /**
     * Returns a single document by its _id
     * The searchTerms are used to set the model language
     * and possible projections or populations ({@link IPopulate})
     * This method is also transaction aware
     * @param searchTerms
     */
    public async findById(searchTerms: ISearchTerms): Promise<Doc<T>> {
        return await this._repo.findById(searchTerms);
    }

    /**
     * Returns a single document matching the searchTerm filters
     * The searchTerms are also used to set the model language
     * and possible projections or populations ({@link IPopulate})
     * This method is also transaction aware
     * @param searchTerms
     */
    public async findOne(searchTerms: ISearchTerms): Promise<Doc<T>> {
        if (searchTerms.id) {
            return await this._repo.findById(searchTerms);
        } else {
            return await this._repo.findOne(searchTerms);
        }
    }


    /**
     * Updates a single document by its _id
     * @param _id
     * @param props
     */
    public async update(_id: string, props: Partial<T> | any): Promise<JsonResponse<Doc<T>>> {
        const response = this._response();
        try {
            const data = this._skipEnrich ? props : this._enrichWithUser(props);
            const models = await this._repo.updateOne(_id, data);
            return response.ok(models);
        } catch (e) {
            Log.exception(e, this.businessUser);
            return response.exception(e);
        }
    }

    /**
     * Updates a single document by its _id
     * @param selector
     * @param props
     */
    public async updateOneByQuery(selector: object, props: Partial<T> | any): Promise<JsonResponse<Doc<T>>> {
        const response = this._response();
        try {
            const updated = await this._repo.updateOneByQuery(selector, props);
            return response.ok(updated);
        } catch (e) {
            Log.exception(e, this.businessUser);
            return response.exception(e);
        }
    }

    /**
     * This method is used to update the documents matching the searchTerms filters
     * @param searchTerms
     * @param props
     */
    public async updateMany(searchTerms: ISearchTerms, props: Partial<T> | any): Promise<JsonResponse<number>> {
        const response = this._response<number>();
        try {
            const data = this._skipEnrich ? props : this._enrichWithUser(props);
            const model = await this._repo.updateMany(searchTerms.filters, data);
            return response.ok(model.n || 0);
        } catch (e) {
            Log.exception(e, this.businessUser);
            return response.exception(e);
        }
    }

    /**
     * Tries to update the document that matches the query.
     * If it is not found, it is created instead (upsert).
     * @param toFind
     * @param item
     * @param options
     */
    public async updateOrCreate(toFind: any, item: Partial<T> | any, options: any = undefined): Promise<JsonResponse<Doc<T>>> {
        const response = this._response();
        try {
            const model = await this._repo.updateOrCreate(toFind, item, options);
            return response.ok(model);
        } catch (e) {
            Log.exception(e, this.businessUser);
            return response.exception(e);
        }
    }

    /**
     * Removes items from each of the matching document's arrayLike property
     * @param searchTerms
     * @param props
     */
    public async spliceFromArray(searchTerms: ISearchTerms, props: Partial<T> | any): Promise<JsonResponse<number>> {
        const response = this._response<number>();
        try {
            const filters = searchTerms.filters;
            if (searchTerms.id) {
                filters.id = searchTerms.id;
            }
            const model = await this._repo.spliceFromArray(filters, props);
            return response.ok(model.n || 0);
        } catch (e) {
            Log.exception(e, this.businessUser);
            return response.exception(e);
        }
    }

    /**
     * Pushes items to an array
     * @param searchTerms
     * @param props
     * @param unique - uses addToSet to ensure uniqueness in the array
     */
    public async pushToArray(searchTerms: ISearchTerms, props: Partial<T> | any, unique: boolean = false): Promise<JsonResponse<number>> {
        const response = this._response<number>();
        try {
            let model;

            if (searchTerms.id && !searchTerms.filters._id) {
                searchTerms.filters._id = searchTerms.id;
            }
            if (unique) {
                model = await this._repo.addToSet(searchTerms.filters, props);
            } else {
                model = await this._repo.pushToArray(searchTerms.filters, props);
            }

            return response.ok(model.n || 0);
        } catch (e) {
            Log.exception(e, this.businessUser);
            return response.exception(e);
        }
    }

    /**
     * Update only mode (does not upsert) for multiple documents
     * @param partials
     * @param props
     */
    public async updateManyWithDifferentValues(partials: Partial<T[]> | any[], props?: string[]): Promise<JsonResponse<IBulkWriteOpResultObject>> {
        const response = this._response<IBulkWriteOpResultObject>();
        try {
            const models = <IBulkWriteOpResultObject>(await this._repo.updateManyWithDifferentValues(partials, props));
            return response.ok(models);
        } catch (e) {
            Log.exception(e, this.businessUser);
            return response.exception(e);
        }
    }

    /**
     * Similar to updateOrCreate but for multiple docs at once. Uses the Bulk operation.
     * @param partials
     * @param props
     */
    public async updateOrCreateMany(partials: (Partial<T>|any)[], props?: string[]): Promise<JsonResponse<IBulkWriteOpResultObject>> {
        const response = this._response<IBulkWriteOpResultObject>();
        try {
            // Temporary interface to match the actual response from the driver vs the interface in the d.ts file
            const bulkOpResult = <IBulkWriteOpResultObject>(await this._repo.updateOrCreateMany(partials, props));
            return response.ok(bulkOpResult);
        } catch (e) {
            Log.exception(e, this.businessUser);
            return response.exception(e);
        }
    }


    /**
     * Deletes the specified document
     * The flag "soft" only works for the extended class {@link BusinessBaseWithDeleted}
     * @param _id
     * @param soft
     */
    public async delete(_id: string, soft: boolean = false): Promise<boolean> {
        return await this._repo.deleteOne({_id: _id});
    }

    /**
     * Deletes the documents matching the searchTerm filters
     * The flag "soft" only works for the extended class {@link BusinessBaseWithDeleted}
     * @param searchTerms
     * @param soft
     */
    public async deleteMany(searchTerms: ISearchTerms, soft: boolean = false): Promise<number> {
        return await this._repo.deleteMany(searchTerms);
    }


    /**
     * Restores a document that has previously been deleted using its _id
     * @param _id
     */
    public async restore(_id: string): Promise<number> {
        return await this._repo.restore(_id);
    }

    /**
     * Duplicates the provided document assigning it a new _id
     * @param searchTerms
     */
    public async duplicate(searchTerms: ISearchTerms): Promise<JsonResponse<Doc<T>>> {
        const model = await this.findOne(searchTerms);
        if (model) {
            const dup: any = model.toObject ? model.toObject() : model;
            delete dup._id;
            delete dup.id;
            delete dup.createdAt;
            delete dup.updatedAt;
            return this._repo.create(dup);
        }
        return new JsonResponse().error("Not Found!");
    }

    /**
     * Returns the max field value for documents matching the query
     * @param field
     * @param st
     */
    public async max(field: keyof T|string, st?: ISearchTerms) {
        return await this._repo.max(field, st);
    }
    /**
     * Returns the min field value for documents matching the query
     * @param field
     * @param st
     */
    public async min(field: keyof T|string, st?: ISearchTerms) {
        return await this._repo.min(field, st);
    }

    /**
     * Retrieves the Model's mapping
     * @param modelOnly
     */
    public getMapping(modelOnly?: boolean) {
        return this._repo.mapping(modelOnly);
    }

    /**
     * Initiates a transaction and returns the session
     */
    public async startTransaction(): Promise<any> {
        if (global.disableTransactions) {
            return -1;
        }
        await this._repo.startTransaction();
        return this._repo.session;
    }

    /**
     * Aborts the transaction
     * ! Warning! Any changes that have been marked as part of this transaction will be rolled back!
     */
    public async abortTransaction() {
        if (global.disableTransactions) {
            return;
        }
        await this._repo.abortTransaction();
    }

    /**
     * Commits the transaction and finalizes the changes
     */
    public async commitTransaction(): Promise<void> {
        if (global.disableTransactions) {
            return;
        }
        await this._repo.commitTransaction();
    }

    /**
     * Adds a given session to the current business, essentially marking future operations as part of a transaction.
     * @param session
     */
    public addTransaction(session: any): void {
        if (global.disableTransactions) {
            return;
        }
        this._repo.setSession(session);
    }

    public scrollSearch(st: ISearchTerms): AsyncGenerator<Doc<T>, void> {
        return this._repo.scrollSearch(st);
    }

    async * scrollBatch(st: ISearchTerms): AsyncGenerator<Doc<T>[], void> {
        const holder = new Holder<Doc<T>>(st.options.limit || global.pagingLimit);
        for await (const doc of this._repo.scrollSearch(st)) {
            holder.push(doc);
            if (holder.check()) {
                yield holder.items;
                holder.clear();
            }
        }
        if (holder.check(true)) {
            yield holder.items;
            holder.clear();
        }
    }

}
