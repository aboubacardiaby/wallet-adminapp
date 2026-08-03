import { apiRequest } from "../../api/httpClient";
import { env } from "../../config/env";
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

interface AgentListResponse {
  agents: Agent[];
  total: number;
  page: number;
  pages: number;
}

const agentBase = () => (env?.enableApiMocks ? "/agents" : "/admin/agents");

export const agentApi = {
  list: (params: AgentListParams) => {
    const url = agentBase();
    if (env?.enableApiMocks) return apiRequest<Page<Agent>>({ url, params });
    return apiRequest<AgentListResponse>({ url, params }).then((raw) => ({
      items: raw.agents ?? [],
      page: raw.page,
      pageSize: params.pageSize ?? 25,
      totalItems: raw.total,
      totalPages: raw.pages,
    }));
  },
  get: (id: string) => apiRequest<Agent>({ url: `${agentBase()}/${id}` }),
  create: (data: AgentInput, status: "DRAFT" | "SUBMITTED" = "DRAFT") =>
    apiRequest<Agent>({ url: agentBase(), method: "POST", data: { ...data, status } }),
  approve: (id: string) => apiRequest<Agent>({ url: `${agentBase()}/${id}/approve`, method: "POST" }),
  reject: (id: string, reason: string) =>
    apiRequest<Agent>({ url: `${agentBase()}/${id}/reject`, method: "POST", data: { reason } }),
  suspend: (id: string, reason: string) =>
    apiRequest<Agent>({ url: `${agentBase()}/${id}/suspend`, method: "POST", data: { reason } }),
  activate: (id: string) => apiRequest<Agent>({ url: `${agentBase()}/${id}/activate`, method: "POST" }),
  terminate: (id: string, reason: string) =>
    apiRequest<Agent>({ url: `${agentBase()}/${id}/terminate`, method: "POST", data: { reason } }),
};
