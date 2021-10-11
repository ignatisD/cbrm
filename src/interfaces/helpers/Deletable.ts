import { EnforceDocument } from "mongoose";

export default interface IDeletable<T extends EnforceDocument<any, any, any>> {

    findDeleted?(...args): any;
    findWithDeleted?(...args): any;

    findOneDeleted?(...args): any;
    findOneWithDeleted?(...args): any;

    findOneAndUpdateDeleted?(...args): any;
    findOneAndUpdateWithDeleted?(...args): any;

    updateDeleted?(...args): any;
    updateWithDeleted?(...args): any;

    countDocumentsDeleted?(...args): any;
    countDocumentsWithDeleted?(...args): any;

    countDeleted?(...args): any;
    countWithDeleted?(...args): any;

    restore?(...args): any;
    delete?(...args): any;

}

