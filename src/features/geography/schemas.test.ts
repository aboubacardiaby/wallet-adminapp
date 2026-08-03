import { describe, expect, it } from "vitest";
import { citySchema, countrySchema } from "./schemas";

describe("geography schemas", () => {
  it("rejects malformed ISO and telephone codes", () => {
    const result=countrySchema.safeParse({name:"Test",iso2Code:"sen",iso3Code:"SN",defaultCurrencyCode:"XOF",timezone:"Africa/Dakar",phoneCountryCode:"221",minimumCustomerAge:18,sendingEnabled:true,receivingEnabled:true,cashPickupEnabled:true,bankDepositEnabled:false,walletDepositEnabled:false,status:"DRAFT"});
    expect(result.success).toBe(false);
  });
  it("requires a country and valid city code", () => {
    const result=citySchema.safeParse({countryId:"",name:"Dakar",code:"dkr",timezone:"Africa/Dakar",cashPickupEnabled:true,bankDepositEnabled:true,walletDepositEnabled:true,status:"ACTIVE"});
    expect(result.success).toBe(false);
  });
});
