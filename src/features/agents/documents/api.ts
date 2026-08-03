import { apiRequest } from "../../../api/httpClient";
import type { AgentDocument } from "../types";

export interface AgentDocumentInput {
  documentType: string;
  fileName: string;
  fileUrl?: string;
}

export const agentDocumentApi = {
  list: (agentId: string) => apiRequest<AgentDocument[]>({ url: `/agents/${agentId}/documents` }),
  create: (agentId: string, data: AgentDocumentInput) =>
    apiRequest<AgentDocument>({ url: `/agents/${agentId}/documents`, method: "POST", data }),
  approve: (agentId: string, documentId: string) =>
    apiRequest<AgentDocument>({ url: `/agents/${agentId}/documents/${documentId}/approve`, method: "POST" }),
  reject: (agentId: string, documentId: string, reason: string) =>
    apiRequest<AgentDocument>({ url: `/agents/${agentId}/documents/${documentId}/reject`, method: "POST", data: { reason } }),
};
