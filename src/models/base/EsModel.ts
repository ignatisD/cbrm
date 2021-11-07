import {
    IEsDoc,
    IEsMappingBody,
    IEsMapping,
    IEsPipeline,
    IEsSettings
} from "@interfaces/models/base/EsModel";

export default abstract class EsModel<T extends IEsDoc> implements IEsDoc {

    static monthlyFormat: string = "YYYY-MM";
    static dateFormat: string = "YYYY-MM-DD";
    static dateFormatFull: string = "YYYY-MM-DD HH:mm";
    static separator: string = "-";
    static _: string = "_";
    static modelName: string = "EsModel";
    static _index: string = "-";
    static _searchIndex: string = "*";
    static _schema: {[key: string]: IEsMapping} = {};
    static template: string = null;

    public _id: string;
    public _index: string;

    public updatedAt: Date|string;

    protected constructor(props?: Partial<T>) {
        if (props) {
            Object.assign(this, props);
            if (!this._id) {
                this._id = this.getId();
                this._index = this.getIndex();
            }
        }
    }

    public get id() {
        return this._id;
    }

    public set id(id) {
        this._id = id;
    }

    public get index() {
        return this._index;
    }

    public set index(index) {
        this._index = index;
    }

    public getId() {
        return this._id;
    }
    public getIndex() {
        return this._index;
    }

    public toObject<P extends IEsDoc>(options?: any): P {
        const obj: any = Object.assign({}, this);
        delete obj.toJSON;
        return obj;
    }

    public toJSON(options?: any): any {
        return this.toObject(options);
    }

    public toString(): string {
        return this._id;
    }

    public static pipeline(): IEsPipeline {
        return null;
    }

    public static settings(): IEsSettings {
        return {
            number_of_shards: 1
        };
    }

    public static mapping(): IEsMappingBody {
        return {
            version: 1,
            index_patterns: [this._searchIndex],
            aliases: {
                [this._index]: {}
            },
            settings: this.settings(),
            mappings: {
                _source: {
                    enabled: true
                },
                properties: this._schema
            }
        };
    }
}