import * as Parse from "parse/node";
import Repository from "@repository/base/Repository";
import IRepositoryBase from "@interfaces/repository/RepositoryBase";
import { IPopulate, ISearchTerms } from "@interfaces/helpers/SearchTerms";
import IPaginatedResults from "@interfaces/helpers/PaginatedResults";
import { Query } from "parse";

export default abstract class ParseRepositoryBase<T = any> extends Repository<Parse.ObjectConstructor> implements IRepositoryBase<T> {

    public textFields: string[] = [];
    protected autopopulate: IPopulate[] = [];

    protected constructor(modelName: string) {
        super(Parse.Object.extend(modelName));
        // this._modelName = modelName;
        Log.debug(this.modelName);
    }

    public query() {
        return new Parse.Query<Parse.Object<T>>(this.model);
    }

    async ensureMapping() {
        return Promise.resolve();
    }

    async createMany(items: Partial<T>[]) {
        return Promise.resolve();
    }

    async search(searchTerms: ISearchTerms): Promise<IPaginatedResults<T>> {
        return await this.retrieve(searchTerms);
    }


    async retrieve(searchTerms: ISearchTerms): Promise<IPaginatedResults<T>> {
        searchTerms.searchIn(this.textFields);
        if (searchTerms.options.autopopulate && !searchTerms.options.populate.length && this.autopopulate.length) {
            searchTerms.options.populate = this.autopopulate;
        }
        if (searchTerms.options.limit === undefined) {
            const docs: T[] = await this.find(searchTerms);
            return this.emptyPaginatedResults(docs);
        } else {
            const docs: T[] = await this.find(searchTerms);
            return this.emptyPaginatedResults(docs);
        }
    }

    find: (params: ISearchTerms) => Promise<any>;
    updateOrCreate: (params: Partial<T>, props?: any) => Promise<any>;
    updateOrCreateMany?: (params: Partial<T>[], props?: any) => Promise<any>;
    deleteById: (id: string, params?: any) => Promise<any>;
    count: (terms: ISearchTerms) => Promise<any>;
    findById: (searchTerms: ISearchTerms) => Promise<any>;
    findOne: (searchTerms: ISearchTerms) => Promise<any>;
    create: (item: any) => Promise<any>;
    insertMany: (items: any[]) => Promise<any>;
    updateOne: (id: string, params: any) => Promise<any>;
    updateMany: (params: any, props?: any) => Promise<any>;
    deleteOne: (params: any) => Promise<any>;
    deleteMany: (params: any) => Promise<any>;

    aggregate<V = any>(pipeline: Query.AggregationOptions | Query.AggregationOptions[]): Promise<V> {
        return Promise.resolve(null);
    }
}