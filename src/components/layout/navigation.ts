import {
  Activity, Banknote, Building2, ClipboardList, Contact, FileText, Gavel, Gauge,
  Landmark, LayoutDashboard, Map, MapPin, Network, ReceiptText, Settings, Shield,
  Store, Users, Wallet, type LucideIcon,
} from "lucide-react";
import type { Permission } from "../../auth/permissions";

export interface NavigationItem {
  label: string;
  path: string;
  permission: Permission;
  icon: LucideIcon;
}
export interface NavigationGroup { label: string; items: NavigationItem[] }

export const navigation: NavigationGroup[] = [
  { label: "Overview", items: [{ label: "Dashboard", path: "/dashboard", permission: "dashboard.view", icon: LayoutDashboard }] },
  { label: "Geography", items: [
    { label: "Countries", path: "/countries", permission: "countries.view", icon: Map },
    { label: "Regions", path: "/regions", permission: "cities.view", icon: Building2 },
    { label: "Cities", path: "/cities", permission: "cities.view", icon: MapPin },
    { label: "Remittance Corridors", path: "/corridors", permission: "corridors.view", icon: Network },
  ] },
  { label: "Agents", items: [
    { label: "All Agents", path: "/agents", permission: "agents.view", icon: Store },
    { label: "Pending Applications", path: "/agents?status=SUBMITTED", permission: "agents.view", icon: FileText },
    { label: "Outlets", path: "/outlets", permission: "agents.view", icon: Building2 },
    { label: "Cashiers", path: "/cashiers", permission: "cashiers.manage", icon: Users },
  ] },
  { label: "Operations", items: [
    { label: "Transactions", path: "/transactions", permission: "transactions.view", icon: ReceiptText },
    { label: "Liquidity", path: "/liquidity", permission: "liquidity.view", icon: Wallet },
    { label: "Settlements", path: "/settlements", permission: "settlements.view", icon: Landmark },
    { label: "Reconciliation", path: "/reconciliation", permission: "reconciliation.manage", icon: ClipboardList },
  ] },
  { label: "Pricing", items: [
    { label: "Fees", path: "/pricing/fees", permission: "commissions.view", icon: Banknote },
    { label: "Exchange-Rate Margins", path: "/pricing/exchange-rates", permission: "commissions.view", icon: Activity },
    { label: "Commission Plans", path: "/pricing/commissions", permission: "commissions.view", icon: Gauge },
  ] },
  { label: "Compliance", items: [
    { label: "KYC Reviews", path: "/kyc", permission: "compliance.view", icon: Contact },
    { label: "Cases", path: "/compliance/cases", permission: "compliance.view", icon: Gavel },
    { label: "Screening Alerts", path: "/compliance/alerts", permission: "compliance.view", icon: Shield },
    { label: "Documents", path: "/compliance/documents", permission: "documents.review", icon: FileText },
  ] },
  { label: "Administration", items: [
    { label: "Users", path: "/users", permission: "users.view", icon: Users },
    { label: "Roles and Permissions", path: "/roles", permission: "roles.manage", icon: Contact },
    { label: "Audit Log", path: "/audit", permission: "audit.view", icon: ClipboardList },
    { label: "System Configuration", path: "/settings", permission: "roles.manage", icon: Settings },
  ] },
];
