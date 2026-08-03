import { apiRequest } from "../../api/httpClient";
import type { City, Country, Page, ReferenceData, Region } from "./types";
import type { CityInput, CountryInput } from "./schemas";

export const geographyApi = {
  references: () => apiRequest<ReferenceData>({url:"/configuration/reference-data"}),
  countries: (params?:Record<string,unknown>) => apiRequest<Page<Country>>({url:"/countries",params}),
  country: (id:string) => apiRequest<Country>({url:`/countries/${id}`}),
  saveCountry: (value:CountryInput,id?:string) => apiRequest<Country>({url:id?`/countries/${id}`:"/countries",method:id?"PUT":"POST",data:value}),
  regions: (countryId?:string) => apiRequest<Page<Region>>({url:"/regions",params:{countryId}}),
  cities: (params?:Record<string,unknown>) => apiRequest<Page<City>>({url:"/cities",params}),
  city: (id:string) => apiRequest<City>({url:`/cities/${id}`}),
  saveCity: (value:CityInput,id?:string,version?:number) => apiRequest<City>({url:id?`/cities/${id}`:"/cities",method:id?"PUT":"POST",data:value,headers:id?{"If-Match":String(version)}:undefined}),
};
