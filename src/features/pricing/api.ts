import { apiRequest } from "../../api/httpClient";
import type {
  ExchangeRatePage,
  FeePreview,
  FeeRule,
  FeeRuleInput,
  FeeRulePage,
  RateOverride,
  RateOverrideInput,
} from "./types";

export const pricingApi = {
  fees: () => apiRequest<FeeRulePage>({ url: "/admin/fees" }),
  createFee: (data: FeeRuleInput) =>
    apiRequest<{ message: string; rule: FeeRule }>({
      url: "/admin/fees",
      method: "POST",
      data,
    }),
  updateFee: (id: string, data: FeeRuleInput) =>
    apiRequest<{ message: string; rule: FeeRule }>({
      url: `/admin/fees/${id}`,
      method: "PUT",
      data,
    }),
  deleteFee: (id: string) =>
    apiRequest<{ message: string }>({
      url: `/admin/fees/${id}`,
      method: "DELETE",
    }),
  previewFee: (from_currency: string, to_currency: string, amount: number) =>
    apiRequest<FeePreview>({
      url: "/admin/fees/preview",
      params: { from_currency, to_currency, amount },
    }),
  rates: () => apiRequest<ExchangeRatePage>({ url: "/admin/exchange-rates" }),
  createOverride: (data: RateOverrideInput) =>
    apiRequest<{ message: string; override: RateOverride }>({
      url: "/admin/exchange-rates/override",
      method: "POST",
      data,
    }),
  updateOverride: (id: string, data: RateOverrideInput) =>
    apiRequest<{ message: string; override: RateOverride }>({
      url: `/admin/exchange-rates/override/${id}`,
      method: "PUT",
      data,
    }),
  deleteOverride: (id: string) =>
    apiRequest<{ message: string }>({
      url: `/admin/exchange-rates/override/${id}`,
      method: "DELETE",
    }),
  refreshRates: () =>
    apiRequest<{ message: string }>({
      url: "/admin/exchange-rates/refresh-cache",
      method: "POST",
    }),
};
