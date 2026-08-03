import { apiRequest } from "../../api/httpClient";
import type { KycPage } from "./types";

export const kycApi={
  list:(params:Record<string,unknown>)=>apiRequest<KycPage>({url:"/admin/kyc",params}),
  review:(id:string,value:{action:"approve"|"reject";rejection_reason?:string;reviewer_id:string})=>apiRequest<{message:string;status:string}>({url:`/admin/kyc/submissions/${id}/review`,method:"PUT",data:value}),
};
