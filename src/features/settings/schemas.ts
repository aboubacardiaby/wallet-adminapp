import { z } from "zod";

export const appSettingsSchema=z.object({
  transfer_fee_rate:z.coerce.number().min(0).max(1),daily_limit_default:z.coerce.number().positive(),
  monthly_limit_default:z.coerce.number().positive(),min_transfer_amount:z.coerce.number().positive(),
  max_transfer_amount:z.coerce.number().positive(),maintenance_mode:z.boolean(),kyc_required:z.boolean(),
  support_email:z.string().email(),app_name:z.string().min(2),
}).refine(x=>x.min_transfer_amount<x.max_transfer_amount,{path:["max_transfer_amount"],message:"Maximum must exceed minimum"});
export const smtpSchema=z.object({
  host:z.string().min(1),port:z.coerce.number().int().min(1).max(65535),username:z.string(),password:z.string(),
  from_email:z.string().email(),from_name:z.string().min(1),use_tls:z.boolean(),use_ssl:z.boolean(),enabled:z.boolean(),
  updated_at:z.string().nullable().optional(),source:z.enum(["env","database"]).optional(),
});

export const waveSchema = z.object({
  api_base_url: z.string().url(),
  api_key: z.string(),
  api_key_configured: z.boolean().optional(),
  business_country: z.string().min(2),
  business_currency: z.string().length(3),
  aggregated_merchant_id: z.string(),
  verify_recipient: z.boolean(),
  enabled: z.boolean(),
  updated_at: z.string().nullable().optional(),
}).superRefine((value, context) => {
  if (value.enabled && !value.api_key && !value.api_key_configured) {
    context.addIssue({
      code: "custom",
      path: ["api_key"],
      message: "An API key is required when Wave is enabled",
    });
  }
});

export const achSchema = z.object({
  api_base_url: z.string().url(),
  api_key: z.string(),
  platform_account_number: z.string(),
  platform_routing_number: z.string().regex(/^\d{9}$|^$/, "Use a 9-digit routing number"),
  platform_account_type: z.string().min(1),
  platform_account_name: z.string().min(1),
  enabled: z.boolean(),
  updated_at: z.string().nullable().optional(),
}).superRefine((value, context) => {
  if (!value.enabled) return;
  for (const [field, fieldValue] of [
    ["api_key", value.api_key],
    ["platform_account_number", value.platform_account_number],
    ["platform_routing_number", value.platform_routing_number],
  ] as const) {
    if (!fieldValue) {
      context.addIssue({
        code: "custom",
        path: [field],
        message: "Required when ACH is enabled",
      });
    }
  }
});
