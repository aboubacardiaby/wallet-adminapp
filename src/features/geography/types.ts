export type CountryStatus = "DRAFT" | "ACTIVE" | "SUSPENDED" | "INACTIVE";

export interface Country {
  id: string; name: string; iso2Code: string; iso3Code: string;
  defaultCurrencyCode: string; timezone: string; phoneCountryCode: string;
  minimumCustomerAge: number; sendingEnabled: boolean; receivingEnabled: boolean;
  cashPickupEnabled: boolean; bankDepositEnabled: boolean; walletDepositEnabled: boolean;
  status: CountryStatus; createdAt: string; updatedAt: string;
}

export interface Region {
  id: string; countryId: string; name: string; code: string; status: "ACTIVE" | "INACTIVE";
}

export interface City {
  id: string; countryId: string; regionId?: string; name: string; code: string;
  timezone: string; serviceRadiusKm?: number; cashPickupEnabled: boolean;
  bankDepositEnabled: boolean; walletDepositEnabled: boolean;
  status: "ACTIVE" | "INACTIVE"; version: number;
}

export interface ReferenceData {
  currencies: Array<{ code: string; name: string }>;
  timezones: string[];
  payoutMethods: Array<{ code: "CASH_PICKUP" | "BANK_DEPOSIT" | "WALLET_DEPOSIT"; name: string }>;
}

export interface Page<T> { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number }
