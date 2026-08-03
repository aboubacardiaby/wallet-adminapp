import { apiRequest } from "../../api/httpClient";
import type { Page } from "../geography/types";
import type { Agent } from "./types";
import type { AgentInput } from "./schemas";

export interface AgentListParams {
  search?: string;
  countryId?: string;
  cityId?: string;
  status?: string;
  service?: string;
  riskRating?: string;
  page?: number;
  pageSize?: number;
}

export const agentApi = {
  list: (params: AgentListParams) => apiRequest<Page<Agent>>({ url: "/agents", params }),
  get: (id: string) => apiRequest<Agent>({ url: `/agents/${id}` }),
  create: (data: AgentInput, status: "DRAFT" | "SUBMITTED" = "DRAFT") =>
    apiRequest<Agent>({ url: "/agents", method: "POST", data: { ...data, status } }),
  approve: (id: string) => apiRequest<Agent>({ url: `/agents/${id}/approve`, method: "POST" }),
  reject: (id: string, reason: string) =>
    apiRequest<Agent>({ url: `/agents/${id}/reject`, method: "POST", data: { reason } }),
  suspend: (id: string, reason: string) =>
    apiRequest<Agent>({ url: `/agents/${id}/suspend`, method: "POST", data: { reason } }),
  activate: (id: string) => apiRequest<Agent>({ url: `/agents/${id}/activate`, method: "POST" }),
  terminate: (id: string, reason: string) =>
    apiRequest<Agent>({ url: `/agents/${id}/terminate`, method: "POST", data: { reason } }),
};
