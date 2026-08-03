export interface RemittanceCorridor {
  id: string; originCountryId: string; destinationCountryId: string;
  sourceCurrencyCode: string; destinationCurrencyCode: string;
  allowedPayoutMethods: Array<"CASH_PICKUP" | "BANK_DEPOSIT" | "WALLET_DEPOSIT">;
  minimumAmount: string; maximumAmount: string; dailyCustomerLimit: string;
  monthlyCustomerLimit: string; feePlanId: string; exchangeRatePlanId: string;
  complianceRuleSetId: string; effectiveFrom: string; effectiveTo?: string;
  status: "DRAFT" | "ACTIVE" | "SUSPENDED" | "EXPIRED"; version: number;
}
