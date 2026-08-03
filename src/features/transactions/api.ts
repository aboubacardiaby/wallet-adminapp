import { apiRequest } from "../../api/httpClient";
import type {
  CashPickupAction,
  DestinationCountryPage,
  Transaction,
  TransactionPage,
} from "./types";

export const transactionApi={
  list:(params:Record<string,unknown>)=>apiRequest<TransactionPage>({url:"/admin/transactions",params}),
  destinationCountries:()=>apiRequest<DestinationCountryPage>({url:"/countries",params:{active_only:true}}),
  processCashPickup:(id:string,data:CashPickupAction)=>apiRequest<{message:string;transaction:Transaction}>({
    url:`/admin/transactions/${id}/cash-pickup`,method:"PUT",data,
  }),
};
