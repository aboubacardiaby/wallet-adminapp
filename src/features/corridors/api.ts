import { apiRequest } from "../../api/httpClient";
import type { Page } from "../geography/types";
import type { CorridorInput } from "./schemas";
import type { RemittanceCorridor } from "./types";

export interface CorridorPlans {
  feePlans:Array<{id:string;name:string}>; exchangeRatePlans:Array<{id:string;name:string}>; complianceRuleSets:Array<{id:string;name:string}>;
}
export interface CorridorPreview {sourceAmount:string;fee:string;destinationAmount:string;sourceCurrencyCode:string;destinationCurrencyCode:string;estimated:boolean}

export const corridorApi={
  list:()=>apiRequest<Page<RemittanceCorridor>>({url:"/corridors"}),
  get:(id:string)=>apiRequest<RemittanceCorridor>({url:`/corridors/${id}`}),
  create:(value:CorridorInput)=>apiRequest<RemittanceCorridor>({url:"/corridors",method:"POST",data:value}),
  activate:(id:string)=>apiRequest<RemittanceCorridor>({url:`/corridors/${id}/activate`,method:"POST"}),
  suspend:(id:string,reason:string)=>apiRequest<RemittanceCorridor>({url:`/corridors/${id}/suspend`,method:"POST",data:{reason}}),
  plans:()=>apiRequest<CorridorPlans>({url:"/configuration/plans"}),
  preview:(value:{amount:string;sourceCurrencyCode:string;destinationCurrencyCode:string})=>apiRequest<CorridorPreview>({url:"/corridors/preview",method:"POST",data:value}),
};
