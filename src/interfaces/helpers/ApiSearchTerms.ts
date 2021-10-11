import { ISearchTerms } from "@interfaces/helpers/SearchTerms";

export interface IApiSearchRoom {
    adults?: number;
    children?: number[];
}
export interface IApiSearchFilters {
    search?: string;
    hotel?: string;
    city?: string;
    region?: string;
    country?: string;
    checkin: string;
    nights: number;
    rooms?: IApiSearchRoom[];
    adults?: number;
    children?: number[];
}

export interface IApiSearchTerms extends ISearchTerms {
    filters: IApiSearchFilters;
}