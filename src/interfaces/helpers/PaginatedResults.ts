export interface IPaginatedResults<T> {
    docs: T[];
    total?: number;
    limit?: number;
    page?: number;
    pages?: number;
    offset?: number;
    pagingCounter?: number;
    hasNextPage?: any;
    nextPage?: any;
    hasPrevPage?: any;
    prevPage?: any;
    took?: any;
    debug?: any;
    errors?: any;
}
