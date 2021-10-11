export interface IBulkWriteOpResultObject {
    insertedCount?: number | undefined;
    matchedCount?: number | undefined;
    modifiedCount?: number | undefined;
    deletedCount?: number | undefined;
    upsertedCount?: number | undefined;
    insertedIds?: { [index: number]: any } | undefined;
    upsertedIds?: { [index: number]: any } | undefined;
    result?: any;
}
