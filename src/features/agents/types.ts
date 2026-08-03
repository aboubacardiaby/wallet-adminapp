export type AgentService = "CASH_PICKUP" | "BANK_DEPOSIT" | "WALLET_DEPOSIT";

export type AgentStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "MORE_INFORMATION_REQUIRED"
  | "APPROVED"
  | "ACTIVE"
  | "SUSPENDED"
  | "REJECTED"
  | "TERMINATED";

export type AgentRiskRating = "LOW" | "MEDIUM" | "HIGH";

export interface Agent {
  id: string;
  agentCode?: string;
  legalBusinessName: string;
  tradingName?: string;
  registrationNumber: string;
  taxIdentificationNumber?: string;
  countryId: string;
  regionId?: string;
  cityId: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  supportedServices: AgentService[];
  dailyPayoutLimit: string;
  maximumCashExposure: string;
  minimumLiquidityThreshold: string;
  commissionPlanId?: string;
  riskRating?: AgentRiskRating;
  status: AgentStatus;
  version: number;
  createdAt: string;
  updatedAt: string;

  // summary fields returned by the list endpoint
  countryName?: string;
  cityName?: string;
  countryCurrencyCode?: string;
  availablePayoutBalance?: string;
}

export type AgentDocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface AgentDocument {
  id: string;
  agentId: string;
  documentType: string;
  fileName: string;
  fileUrl?: string;
  status: AgentDocumentStatus;
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}
