export interface IMappingProperty {
    type?: "string" | "number" | "model" | "date" | "object" | "boolean" | "complex";
    properties?: IMapping;
    ref?: string;
    approval?: boolean;
    intl?: boolean;
    array?: boolean;
    map?: "string" | "number" | "model" | "date" | "object" | "boolean" | "complex";
    enum?: [string | number];
}

export default interface IMapping {
    [key: string]: IMappingProperty;
}

export interface IMappingResponse {
    model: string;
    mapping: IMapping;
    translations?: any;
}
