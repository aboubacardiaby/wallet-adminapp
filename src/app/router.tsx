import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "../auth/RequireAuth";
import { RequirePermission } from "../auth/RequirePermission";
import type { Permission } from "../auth/permissions";
import { AppShell } from "../components/layout/AppShell";
import { LoginPage } from "../features/auth/LoginPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { NotFoundPage } from "../features/foundation/NotFoundPage";
import { PlaceholderPage } from "../features/foundation/PlaceholderPage";
import { UnauthorizedPage } from "../features/foundation/UnauthorizedPage";
import { CountryListPage } from "../features/geography/CountryListPage";
import { CountryFormPage } from "../features/geography/CountryFormPage";
import { CountryDetailPage } from "../features/geography/CountryDetailPage";
import { RegionListPage } from "../features/geography/RegionListPage";
import { CityListPage } from "../features/geography/CityListPage";
import { CityFormPage } from "../features/geography/CityFormPage";
import { CorridorListPage } from "../features/corridors/CorridorListPage";
import { CorridorFormPage } from "../features/corridors/CorridorFormPage";
import { CorridorDetailPage } from "../features/corridors/CorridorDetailPage";
import { TransactionListPage } from "../features/transactions/TransactionListPage";
import { KycPage } from "../features/kyc/KycPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { AgentListPage } from "../features/agents/AgentListPage";
import { AgentDetailPage } from "../features/agents/AgentDetailPage";
import { AgentFormPage } from "../features/agents/AgentFormPage";
import { FeeManagementPage } from "../features/pricing/FeeManagementPage";
import { ExchangeRatePage } from "../features/pricing/ExchangeRatePage";
import { UsersListPage } from "../features/users/UsersListPage";

const routes: Array<[string, string, Permission]> = [
  ["/agents/:agentId/edit", "Edit agent", "agents.update"], ["/agents/:agentId/documents", "Agent documents", "agents.view"],
  ["/agents/:agentId/outlets", "Agent outlets", "agents.view"], ["/agents/:agentId/liquidity", "Agent liquidity", "liquidity.view"],
  ["/agents/:agentId/commissions", "Agent commissions", "commissions.view"], ["/agents/:agentId/audit", "Agent audit history", "audit.view"],
  ["/outlets", "Outlets", "agents.view"], ["/outlets/:outletId", "Outlet details", "agents.view"], ["/cashiers", "Cashiers", "cashiers.manage"],
  ["/liquidity", "Liquidity", "liquidity.view"], ["/settlements", "Settlements", "settlements.view"],
  ["/settlements/:settlementId", "Settlement details", "settlements.view"], ["/reconciliation", "Reconciliation", "reconciliation.manage"],
  ["/compliance/cases", "Compliance cases", "compliance.view"], ["/compliance/cases/:caseId", "Compliance case", "compliance.view"],
  ["/compliance/alerts", "Screening alerts", "compliance.view"], ["/compliance/documents", "Document reviews", "documents.review"],
  ["/pricing/commissions", "Commission plans", "commissions.view"],
  ["/roles", "Roles and permissions", "roles.manage"], ["/audit", "Audit log", "audit.view"],
];

export function AppRouter() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/unauthorized" element={<UnauthorizedPage />} />
    <Route element={<RequireAuth />}><Route element={<AppShell />}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route element={<RequirePermission permission="dashboard.view" />}><Route path="/dashboard" element={<DashboardPage />} /></Route>
      <Route element={<RequirePermission permission="countries.view" />}><Route path="/countries" element={<CountryListPage />} /><Route path="/countries/:countryId" element={<CountryDetailPage />} /></Route>
      <Route element={<RequirePermission permission="countries.manage" />}><Route path="/countries/new" element={<CountryFormPage />} /><Route path="/countries/:countryId/edit" element={<CountryFormPage />} /></Route>
      <Route element={<RequirePermission permission="cities.view" />}><Route path="/regions" element={<RegionListPage />} /><Route path="/countries/:countryId/regions" element={<RegionListPage />} /><Route path="/cities" element={<CityListPage />} /><Route path="/countries/:countryId/cities" element={<CityListPage />} /><Route path="/cities/:cityId" element={<CityFormPage />} /></Route>
      <Route element={<RequirePermission permission="cities.manage" />}><Route path="/cities/new" element={<CityFormPage />} /></Route>
      <Route element={<RequirePermission permission="corridors.view" />}><Route path="/corridors" element={<CorridorListPage />} /><Route path="/corridors/:corridorId" element={<CorridorDetailPage />} /></Route>
      <Route element={<RequirePermission permission="corridors.manage" />}><Route path="/corridors/new" element={<CorridorFormPage />} /></Route>
      <Route element={<RequirePermission permission="transactions.view" />}><Route path="/transactions" element={<TransactionListPage />} /><Route path="/transactions/:transactionId" element={<TransactionListPage />} /></Route>
      <Route element={<RequirePermission permission="agents.view" />}><Route path="/agents" element={<AgentListPage />} /><Route path="/agents/:agentId" element={<AgentDetailPage />} /></Route>
      <Route element={<RequirePermission permission="agents.create" />}><Route path="/agents/new" element={<AgentFormPage />} /></Route>
      <Route element={<RequirePermission permission="commissions.view" />}><Route path="/pricing/fees" element={<FeeManagementPage />} /><Route path="/pricing/exchange-rates" element={<ExchangeRatePage />} /></Route>
      <Route element={<RequirePermission permission="compliance.view" />}><Route path="/kyc" element={<KycPage />} /></Route>
      <Route element={<RequirePermission permission="roles.manage" />}><Route path="/settings" element={<SettingsPage />} /></Route>
      <Route element={<RequirePermission permission="users.view" />}><Route path="/users" element={<UsersListPage />} /></Route>
      {routes.map(([path, title, permission]) => <Route key={path} element={<RequirePermission permission={permission} />}><Route path={path} element={<PlaceholderPage title={title} />} /></Route>)}
      <Route path="*" element={<NotFoundPage />} />
    </Route></Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>;
}
