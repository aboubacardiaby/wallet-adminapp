import Decimal from "decimal.js";
import { z } from "zod";

const money = z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter a positive decimal amount");

export const corridorSchema = z.object({
  originCountryId: z.string().min(1), destinationCountryId: z.string().min(1),
  sourceCurrencyCode: z.string().regex(/^[A-Z]{3}$/),
  destinationCurrencyCode: z.string().regex(/^[A-Z]{3}$/),
  allowedPayoutMethods: z.array(z.enum(["CASH_PICKUP","BANK_DEPOSIT","WALLET_DEPOSIT"])).min(1),
  minimumAmount: money, maximumAmount: money, dailyCustomerLimit: money, monthlyCustomerLimit: money,
  feePlanId: z.string().min(1), exchangeRatePlanId: z.string().min(1), complianceRuleSetId: z.string().min(1),
  effectiveFrom: z.string().min(1), effectiveTo: z.string().optional(),
}).superRefine((value, context) => {
  if (value.originCountryId === value.destinationCountryId) context.addIssue({ code:"custom",path:["destinationCountryId"],message:"Destination must differ from origin" });
  if (new Decimal(value.minimumAmount).gte(value.maximumAmount)) context.addIssue({ code:"custom",path:["maximumAmount"],message:"Maximum must exceed minimum" });
  if (value.effectiveTo && value.effectiveTo < value.effectiveFrom) context.addIssue({ code:"custom",path:["effectiveTo"],message:"End date must follow start date" });
});

export type CorridorInput = z.infer<typeof corridorSchema>;
