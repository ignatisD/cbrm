import { Schema } from "mongoose";

function translateDocs<T>(docs: T | T[], lang: string) {
    if (!Array.isArray(docs)) {
        docs = [docs];
    }
    for (let doc of docs) {
        // @ts-ignore
        doc?.setLanguage && doc.setLanguage(lang);
    }
}

export default function realIntl(schema: Schema) {
    schema.post(/findOne|find|findById|findOneWithDeleted|findWithDeleted/, function(docs) {
        translateDocs(docs, this.options.language || this.options.collation?.locale);
    });
}
