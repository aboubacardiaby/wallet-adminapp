import { expect, it } from "vitest";
import { apiRequest } from "../../api/httpClient";
import type { Country } from "./types";

async function signIn() { await apiRequest({url:"/auth/mock-login",method:"POST",data:{role:"SUPER_ADMINISTRATOR"}}); }

it("creates and reads a configured country through the mock API",async()=>{
  await signIn();
  const created=await apiRequest<Country>({url:"/countries",method:"POST",data:{name:"Sierra Leone",iso2Code:"SL",iso3Code:"SLE",defaultCurrencyCode:"USD",timezone:"UTC",phoneCountryCode:"+232",minimumCustomerAge:18,sendingEnabled:false,receivingEnabled:true,cashPickupEnabled:true,bankDepositEnabled:false,walletDepositEnabled:false,status:"DRAFT"}});
  expect(created.id).toMatch(/^country-/);
  const loaded=await apiRequest<Country>({url:`/countries/${created.id}`});
  expect(loaded.name).toBe("Sierra Leone");
});

it("rejects duplicate city codes within a country",async()=>{
  await signIn();
  await expect(apiRequest({url:"/cities",method:"POST",data:{countryId:"country-sn",regionId:"region-dakar",name:"Duplicate Dakar",code:"DKR",timezone:"Africa/Dakar",serviceRadiusKm:10,cashPickupEnabled:true,bankDepositEnabled:false,walletDepositEnabled:false,status:"ACTIVE"}})).rejects.toMatchObject({status:400});
});
