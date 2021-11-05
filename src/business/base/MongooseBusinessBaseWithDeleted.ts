import MongooseBusinessBase from "@business/base/MongooseBusinessBase";
import { MongooseRepositoryBaseWithDeleted } from "@repository/base/MongooseRepositoryBaseWithDeleted";
import { ISearchTerms } from "@interfaces/helpers/SearchTerms";
import { Doc } from "@interfaces/models/base/ModelBase";
import IPaginatedResults from "@interfaces/helpers/PaginatedResults";

export default class MongooseBusinessBaseWithDeleted<T> extends MongooseBusinessBase<T> {

    protected _repo: MongooseRepositoryBaseWithDeleted;

    protected constructor(repo: MongooseRepositoryBaseWithDeleted) {
        super(repo);
        this._repo = repo;
    }
    async find (searchTerms: ISearchTerms): Promise<Doc<T>[]> {
        if (searchTerms.filters && searchTerms.filters.deleted) {
            delete searchTerms.filters.deleted;
            return await this._repo.findWithDeleted(searchTerms);
        }
        return await super.find(searchTerms);
    }

    async retrieve(searchTerms: ISearchTerms): Promise<IPaginatedResults<Doc<T>>> {
        if (searchTerms.filters && searchTerms.filters.deleted) {
            delete searchTerms.filters.deleted;
            return await this._repo.retrieveWithDeleted(searchTerms);
        }
        return await super.retrieve(searchTerms);
    }

    async findById (searchTerms: ISearchTerms): Promise<Doc<T>> {
        if (searchTerms.filters && searchTerms.filters.deleted) {
            delete searchTerms.filters.deleted;
            return await this._repo.findByIdWithDeleted(searchTerms);
        }
        return await super.findById(searchTerms);
    }
    async findOne (searchTerms: ISearchTerms): Promise<Doc<T>> {
        if (searchTerms.id) {
            if (searchTerms.filters && searchTerms.filters.deleted) {
                delete searchTerms.filters.deleted;
                return await this._repo.findByIdWithDeleted(searchTerms);
            }
            return await this._repo.findById(searchTerms);
        } else {
            if (searchTerms.filters && searchTerms.filters.deleted) {
                delete searchTerms.filters.deleted;
                return await this._repo.findOneWithDeleted(searchTerms);
            }
            return await this._repo.findOne(searchTerms);
        }
    }

    async delete (_id: string, soft: boolean = false): Promise<boolean> {
        if (soft) {
            return await this._repo.softDelete(_id);
        }
        return await this._repo.deleteOne({_id: _id});
    }
    async deleteMany (searchTerms: ISearchTerms, soft: boolean = false): Promise<number> {
        if (soft) {
            return await this._repo.softDeleteMany(searchTerms);
        }
        return await this._repo.deleteMany(searchTerms);
    }

    async restore (_id: string): Promise<number> {
        return await this._repo.restore(_id);
    }
}
