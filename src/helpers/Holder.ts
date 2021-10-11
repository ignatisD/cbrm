/**
 * A helper class that stores an array of typed objects and
 * has methods to determine when a certain limit of items
 * has been reached.
 */
export default class Holder<T = any> {

    /**
     * The limit that should not be exceeded
     */
    protected _limit: number;
    /**
     * The item collection
     */
    protected _items: T[] = [];

    /**
     * The Bag constructor
     * During initialization the limit is set
     * @param limit
     */
    constructor(limit: number = 1000) {
        this._limit = limit;
    }

    /**
     * Getter for the collection's limit
     */
    public get limit() {
        return this._limit;
    }

    /**
     * Getter used to retrieve the item collection
     */
    public get items(): T[] {
        return this._items;
    }

    /**
     * Method to add an array of items to the existing collection
     * @param items
     */
    public add(items: T[]): boolean {
        this._items.push(...items);
        return this.check();
    }

    /**
     * Method to push a single item to the existing collection
     * @param item
     */
    public push(item: T): boolean {
        this._items.push(item);
        return this.check();
    }

    /**
     * Method to check if the limit has been reached.
     * If the checkEmpty boolean is provided and is true, then
     * this method determines if there are any remaining items
     * in the collection regardless of the limit
     * @param checkEmpty
     */
    public check(checkEmpty?: boolean): boolean {
        if (!!checkEmpty) {
            return this._items.length > 0;
        }
        return this._items.length >= this._limit;
    }

    /**
     * Empties the array and returns the number of deleted items
     */
    public clear(): number {
        const total = this._items.length;
        this._items = [];
        return total;
    }
}