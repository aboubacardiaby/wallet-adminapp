export interface FeeRule {
  id: string | null;
  name: string;
  from_currency: string | null;
  to_currency: string | null;
  fee_rate: number;
  fee_flat: number;
  min_fee: number | null;
  max_fee: number | null;
  min_amount: number | null;
  max_amount: number | null;
  priority: number;
  is_active: boolean;
  note: string | null;
  is_system_default?: boolean;
}

export type FeeRuleInput = Omit<FeeRule, "id" | "is_system_default">;

export interface FeeRulePage {
  rules: FeeRule[];
  effective_default: FeeRule;
}

export interface FeePreview {
  fee: number;
  fee_rate: number;
  fee_flat: number;
  rule_name?: string;
  [key: string]: unknown;
}

export interface ExchangePair {
  from_currency: string;
  to_currency: string;
  live_rate: number;
  effective_rate: number;
  has_override: boolean;
  fetched_at: number | null;
}

export interface RateOverride {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  spread_pct: number;
  note: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type RateOverrideInput = Omit<
  RateOverride,
  "id" | "created_at" | "updated_at"
>;

export interface ExchangeRatePage {
  pairs: ExchangePair[];
  overrides: RateOverride[];
}
