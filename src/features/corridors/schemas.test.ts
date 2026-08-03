import { expect, it } from "vitest";
import { corridorSchema } from "./schemas";

const valid={originCountryId:"country-sn",destinationCountryId:"country-gm",sourceCurrencyCode:"XOF",destinationCurrencyCode:"GMD",allowedPayoutMethods:["CASH_PICKUP"] as const,minimumAmount:"100",maximumAmount:"1000",dailyCustomerLimit:"2000",monthlyCustomerLimit:"5000",feePlanId:"fee",exchangeRatePlanId:"rate",complianceRuleSetId:"rules",effectiveFrom:"2026-08-01",effectiveTo:""};

it("requires the maximum to exceed the minimum",()=>expect(corridorSchema.safeParse({...valid,maximumAmount:"50"}).success).toBe(false));
it("prevents a same-country corridor",()=>expect(corridorSchema.safeParse({...valid,destinationCountryId:"country-sn"}).success).toBe(false));
