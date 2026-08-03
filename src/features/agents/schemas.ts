import { z } from "zod";

export const ownerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  ownershipPercent: z.string().min(1, "Ownership is required"),
  isBeneficialOwner: z.boolean(),
});

export const documentSchema = z.object({
  documentType: z.string().min(1, "Document type is required"),
  fileName: z.string().min(1, "File name is required"),
});

export const bankSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  bankName: z.string().min(1, "Bank name is required"),
  currencyCode: z.string().min(1, "Currency is required"),
  isPrimary: z.boolean(),
});

export const agentSchema = z.object({
  legalBusinessName: z.string().min(1, "Legal business name is required"),
  tradingName: z.string().optional(),
  registrationNumber: z.string().min(1, "Registration number is required"),
  taxIdentificationNumber: z.string().optional(),

  countryId: z.string().min(1, "Country is required"),
  regionId: z.string().optional(),
  cityId: z.string().min(1, "City is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),

  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Enter a valid email"),
  contactPhone: z.string().min(1, "Contact phone is required"),

  supportedServices: z.array(z.enum(["CASH_PICKUP", "BANK_DEPOSIT", "WALLET_DEPOSIT"])).min(1, "Select at least one service"),
  dailyPayoutLimit: z.string().min(1, "Daily payout limit is required"),
  maximumCashExposure: z.string().min(1, "Maximum cash exposure is required"),
  minimumLiquidityThreshold: z.string().min(1, "Minimum liquidity threshold is required"),
  commissionPlanId: z.string().optional(),
  riskRating: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),

  owners: z.array(ownerSchema),
  documents: z.array(documentSchema),
  bank: bankSchema,
});

export type AgentInput = z.infer<typeof agentSchema>;
