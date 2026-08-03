export interface Transaction {
  id:string; transaction_ref:string; type:string; status:string;
  from_phone:string; to_phone:string; sender_name?:string|null; recipient_name?:string|null;
  destination_country?:string|null;
  amount:string; fee:string; total_amount:string; currency:string; description:string;
  agent_id?:string|null; extra_data?:Record<string,unknown>|null;
  created_at:string; completed_at?:string|null;
}
export interface TransactionPage {transactions:Transaction[];total:number;page:number;pages:number}

export interface DestinationCountry {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export interface DestinationCountryPage {
  countries: DestinationCountry[];
}

export interface CashPickupAction {
  action: "confirm" | "cancel";
  pickup_code?: string;
  admin_notes?: string;
}
