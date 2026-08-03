import { apiRequest } from "../../../api/httpClient";
import { env } from "../../../config/env";
import type { AgentDocument } from "../types";

export interface AgentDocumentInput {
  documentType: string;
  fileName: string;
  fileUrl?: string;
}

const agentBase = () => (env?.enableApiMocks ? "/agents" : "/admin/agents");

export const agentDocumentApi = {
  list: (agentId: string) => apiRequest<AgentDocument[]>({ url: `${agentBase()}/${agentId}/documents` }),
  create: (agentId: string, data: AgentDocumentInput) =>
    apiRequest<AgentDocument>({ url: `${agentBase()}/${agentId}/documents`, method: "POST", data }),
  approve: (agentId: string, documentId: string) =>
    apiRequest<AgentDocument>({ url: `${agentBase()}/${agentId}/documents/${documentId}/approve`, method: "POST" }),
  reject: (agentId: string, documentId: string, reason: string) =>
    apiRequest<AgentDocument>({ url: `${agentBase()}/${agentId}/documents/${documentId}/reject`, method: "POST", data: { reason } }),
};
