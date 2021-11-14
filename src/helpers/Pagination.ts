import IPaginatedResults from "../interfaces/helpers/PaginatedResults";
import IError from "../interfaces/helpers/Error";

export default class Pagination<T = any> implements IPaginatedResults<T> {

    public docs: T[] = [];
    public total: number = 0;
    public limit: number = global.pagingLimit;
    public page: number = 1;
    public pages: number = 0;
    public offset: number = 0;
    public pagingCounter: number = 1;
    public took: number;
    public debug: any;
    public errors: IError[];

    constructor(paginatedResults?: IPaginatedResults<T>) {
        if (paginatedResults) {
            this.docs = paginatedResults.docs || [];
            this.total = paginatedResults.total || 0;
            this.limit = paginatedResults.limit || 0;
            this.page = paginatedResults.page || 1;
            this.sync();
        }
    }

    public setDebug(debug: any, errors?: IError[]): IPaginatedResults<T> {
        this.debug = debug;
        if (errors) {
            this.errors = errors;
        }
        return this;
    }

    public toObject(): IPaginatedResults<T> {
        const result: IPaginatedResults<T> = {
            docs: this.docs,
            total: this.total,
            limit: this.limit,
            page: this.page,
            pages: this.pages,
            offset: this.offset,
            took: this.took,
            pagingCounter: this.pagingCounter,
            hasNextPage: this.hasNextPage,
            hasPrevPage: this.hasPrevPage
        };
        if (this.debug) {
            result.debug = this.debug;
        }
        if (this.errors) {
            result.errors = this.errors;
        }
        return result;
    }

    public toString() {
        return JSON.stringify(this.toObject());
    }

    public itTook(took: number) {
        this.took = took || 0;
        return this;
    }

    public get hasNextPage(): boolean {
        return this.page < this.pages;
    }

    public nextPage() {
        if (this.hasNextPage) {
            ++this.page;
        }
        return this;
    }

    public get hasPrevPage(): boolean {
        return this.page > 1;
    }

    public prevPage() {
        if (this.hasPrevPage) {
            --this.page;
        }
        return this;
    }

    /**
     * Main method to sync the pagination after a property has changed.
     */
    public sync() {
        if (this.docs.length > this.total) {
            this.total = this.docs.length;
        }
        if (this.limit > 0 && this.docs.length > this.limit) {
            this.limit = this.docs.length;
        }
        this.pages = this.limit > 0 ? Math.ceil(this.total / this.limit) : 1;
        this.offset = (this.page - 1) * this.limit;
        this.pagingCounter = this.offset + 1;
        return this;
    }

    setPage(page: number = 1) {
        if (page <= 0) {
            page = 1;
        }
        if (this.page === page) {
            return this;
        }
        this.page = page;
        this.sync();
        return this;
    }

    setLimit(limit: number = global.pagingLimit) {
        if (limit < 0) {
            limit = global.pagingLimit;
        }
        if (this.limit === limit) {
            return this;
        }
        this.limit = limit;
        this.sync();
        return this;
    }

    setTotal(total: number = 0) {
        if (total < 0) {
            total = 0;
        }
        if (this.total === total) {
            return this;
        }
        this.total = total;
        this.sync();
        return this;
    }

    setResults(docs: T[] = []) {
        this.docs = docs;
        this.sync();
        return this;
    }

    addResults(docs: T[] = [], prepend: boolean = false) {
        if (prepend) {
            this.docs = docs.concat(this.docs);
        } else {
            this.docs = this.docs.concat(docs);
        }
        this.sync();
        return this;
    }

    addResult(doc: T, prepend: boolean = false) {
        if (!doc) {
            return this;
        }
        if (prepend) {
            this.docs.unshift(doc);
        } else {
            this.docs.push(doc);
        }
        return this;
    }

    clear() {
        this.docs = [];
        this.sync();
        return this;
    }

    reset() {
        this.total = 0;
        this.limit = global.pagingLimit;
        this.page = 1;
        this.clear();
        return this;
    }
}
