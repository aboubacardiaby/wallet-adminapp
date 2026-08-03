import { z } from "zod";

export const countrySchema = z.object({
  name: z.string().trim().min(2).max(100),
  iso2Code: z.string().trim().regex(/^[A-Z]{2}$/, "Use a two-letter uppercase ISO code"),
  iso3Code: z.string().trim().regex(/^[A-Z]{3}$/, "Use a three-letter uppercase ISO code"),
  defaultCurrencyCode: z.string().regex(/^[A-Z]{3}$/),
  timezone: z.string().min(1),
  phoneCountryCode: z.string().regex(/^\+\d{1,4}$/, "Use a prefix such as +221"),
  minimumCustomerAge: z.coerce.number().int().min(16).max(25),
  sendingEnabled: z.boolean(),
  receivingEnabled: z.boolean(),
  cashPickupEnabled: z.boolean(),
  bankDepositEnabled: z.boolean(),
  walletDepositEnabled: z.boolean(),
  status: z.enum(["DRAFT", "ACTIVE", "SUSPENDED", "INACTIVE"]),
});

export const citySchema = z.object({
  countryId: z.string().min(1, "Country is required"),
  regionId: z.string().optional(),
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().regex(/^[A-Z0-9]{2,8}$/, "Use 2–8 uppercase letters or numbers"),
  timezone: z.string().min(1),
  serviceRadiusKm: z.coerce.number().positive().max(1000).optional(),
  cashPickupEnabled: z.boolean(),
  bankDepositEnabled: z.boolean(),
  walletDepositEnabled: z.boolean(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type CountryInput = z.infer<typeof countrySchema>;
export type CityInput = z.infer<typeof citySchema>;
