# Improvement Tasks: Remittance Agent Administration Portal

This document captures the main improvement potentials for the current admin application and breaks them into concrete, actionable tasks. It is intended to be used as a backlog or roadmap for the next development cycles.

## Current State

- Stack: React 18, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod, Material UI, Vitest, Playwright, MSW.
- Implemented: authentication/permissions skeleton, navigation, dashboard placeholder, geography (countries/regions/cities), city and country forms, remittance corridor list/detail/form, transaction list placeholder, KYC placeholder, settings placeholder, API client, error and money utilities.
- Not yet implemented or only stubbed: agent onboarding and lifecycle, outlet/cashier management, full pricing (fees/exchange rates/commissions), settlements, reconciliation, compliance cases, audit log, system configuration, production OIDC integration.

## How to use this file

- Each task has a priority (P0 critical, P1 important, P2 nice-to-have), an effort estimate (XS/S/M/L/XL), and a short acceptance checklist.
- Progress can be tracked by editing the `[ ]` checkboxes as work is completed.

---

## 1. Feature Completeness

### 1.1 Finish the Agent domain

**Why:** Agents are the core entity of the portal. Only a list page exists; onboarding, detail, and workflow are missing.

- [ ] **AGT-1** Implement `AgentListPage` with server-side pagination, search, filters, and CSV export (P1, L)
  - [ ] Query params sent to `/agents`
  - [ ] Country, city, status, service, risk filters
  - [ ] Status and liquidity indicators
  - [ ] Export based on current user's scope
- [ ] **AGT-2** Build `AgentDetailPage` with tabbed layout (P1, L)
  - [ ] Overview, owners/BOs, documents, outlets, cashiers, services/limits, liquidity, commission, settlements, compliance, audit
- [ ] **AGT-3** Create multi-step agent onboarding wizard (P0, XL)
  - [ ] Business info, location/contact, owners, services/limits, bank/settlement, documents, review/submit
  - [ ] Draft persistence across browser refreshes
  - [ ] Validation with Zod and React Hook Form
- [ ] **AGT-4** Implement status workflow actions with confirmation dialogs (P1, M)
  - [ ] Submit, request more info, approve, reject, suspend, reactivate, terminate
  - [ ] Require comments for rejection, suspension, termination, more-info
  - [ ] Send `version` header/body to prevent lost updates
- [ ] **AGT-5** Add agent document upload and review (P1, M)
  - [ ] Presigned upload, MIME/size restrictions, progress, review status, expiration warnings

### 1.2 Implement Outlet and Cashier management

**Why:** The spec requires per-outlet operational hours, users, devices, and liquidity, plus cashier lifecycle.

- [ ] **OUT-1** Build `OutletListPage` and `OutletDetailPage` (P1, L)
- [ ] **OUT-2** Add outlet form with operating hours, limits, and status (P1, M)
- [ ] **CSH-1** Build cashier invitation, activation, deactivation, role/outlet assignment (P1, M)
- [ ] **CSH-2** Display MFA status, last login, registered devices, and forced-logout action (P2, S)

### 1.3 Implement Pricing module

**Why:** Fees, exchange-rate margins, and commission plans are central to the business model and currently placeholders.

- [ ] **PRC-1** Build `FeeManagementPage` (P1, L)
  - [ ] Fee plan list, create/edit, validation, effective dates
  - [ ] Pricing preview for a corridor/amount
- [ ] **PRC-2** Build `ExchangeRatePage` (P1, L)
  - [ ] Rate plan list, margin configuration, preview
- [ ] **PRC-3** Build `CommissionPlanPage` (P1, M)
  - [ ] Tiered commission rules with overlap/gap validation
  - [ ] Decimal-safe calculations (use existing `Decimal.js` money utilities)

### 1.4 Implement Operations domain

**Why:** Transactions, liquidity, settlements, and reconciliation are listed in the menu but only stubbed.

- [ ] **OPS-1** Complete `TransactionListPage` with full filters (P1, M)
  - [ ] Reference, date range, country, agent/outlet, status, payout method, currency, amount, compliance
- [ ] **OPS-2** Build `TransactionDetailPage` with masked data and hold/release/escalate actions (P1, M)
- [ ] **OPS-3** Add liquidity views and adjustment creation (P1, L)
- [ ] **OPS-4** Build settlements list and detail (P2, L)
- [ ] **OPS-5** Build reconciliation list and variance resolution (P2, L)

### 1.5 Implement Compliance module

**Why:** KYC/KYB and compliance case management are currently empty placeholders.

- [ ] **KYC-1** Complete `KycPage` work queue with filters and review actions (P1, L)
- [ ] **CMP-1** Build compliance cases list and detail (P1, L)
  - [ ] Status workflow: OPEN, IN_REVIEW, INFORMATION_REQUESTED, ESCALATED, CLEARED, REJECTED, CLOSED
  - [ ] Reason and notes capture
  - [ ] Restricted notes not shown to operational users
- [ ] **CMP-2** Add screening alerts and document review (P2, M)

### 1.6 Implement Administration module

**Why:** Users, roles, audit log, and system settings are required for a production admin portal.

- [ ] **ADM-1** Build `UsersListPage` and user management forms (P1, M)
- [ ] **ADM-2** Build roles and permissions management (P1, M)
- [ ] **ADM-3** Build read-only audit log with search and export (P1, L)
- [ ] **ADM-4** Complete `SettingsPage` with API and SMTP integration (P1, M)

### 1.7 Replace dashboard placeholders with real data

**Why:** The current dashboard values are illustrative; stakeholders need trusted metrics scoped to the user.

- [ ] **DSH-1** Wire dashboard cards to real endpoints (P1, M)
- [ ] **DSH-2** Add trend charts and agent breakdown by country (P2, M)
- [ ] **DSH-3** Add liquidity and compliance alert widgets (P2, S)

---

## 2. Technical Health

### 2.1 Clean up build and config artifacts

**Why:** Duplicate and misclassified tooling creates confusion and can cause build/tooling drift.

- [ ] **TH-1** Remove duplicate `vite.config.js` / `vite.config.ts` or merge into one canonical config (P0, XS)
- [ ] **TH-2** Move Vite, `typescript`, and `@vitejs/plugin-react` to `devDependencies` (P0, XS)
- [ ] **TH-3** Pin or correct dependency versions (`@emotion/styled`, `zod`, `react-router-dom`, etc.) (P0, S)
- [ ] **TH-4** Ensure `package-lock.json` is in sync with `package.json` (P0, XS)

### 2.2 Improve code organization and reuse

**Why:** Several feature areas repeat similar patterns (lists, forms, data grids). Shared components will reduce duplication.

- [ ] **TH-5** Extract reusable `DataGrid` with sorting, pagination, and row actions (P1, M)
- [ ] **TH-6** Create generic `FilterBar` and `SearchInput` components (P1, S)
- [ ] **TH-7** Standardize form page wrappers and `useFormPage` hook (P1, M)
- [ ] **TH-8** Add a shared `ConfirmDialog` for destructive/status-change actions (P1, S)

### 2.3 API client robustness

**Why:** The HTTP client already normalizes errors, but could benefit from correlation IDs, request/response interceptors, and consistent typing.

- [ ] **TH-9** Generate or centralize typed API contracts from a schema (P1, M)
- [ ] **TH-10** Add automatic correlation ID to every request (P1, XS)
- [ ] **TH-11** Add global 401 redirect and 403 unauthorized handling (P1, S)
- [ ] **TH-12** Add request deduplication/cancellation on unmount (P2, S)

---

## 3. Security and Compliance

### 3.1 Production authentication

**Why:** The app currently uses `/auth/me` with cookies and a mock login. Production needs OIDC/PKCE and session hygiene.

- [ ] **SEC-1** Replace mock login with OIDC Authorization Code + PKCE flow (P0, L)
- [ ] **SEC-2** Store tokens in secure, HTTP-only, SameSite cookies via BFF (P0, L)
- [ ] **SEC-3** Implement inactivity timeout warning and auto-logout (P1, M)
- [ ] **SEC-4** Clear TanStack Query cache on logout (P1, S)
- [ ] **SEC-5** Document token-storage design and trade-offs if BFF is not available (P1, XS)

### 3.2 Sensitive data handling

**Why:** The spec requires masking by default and audit for reveal.

- [ ] **SEC-6** Add reusable `MaskedField` / `RevealButton` components (P1, M)
- [ ] **SEC-7** Mask sender, recipient, identity, and bank details by default (P1, M)
- [ ] **SEC-8** Audit reveal actions to the backend (P1, S)
- [ ] **SEC-9** Ensure no secrets, tokens, or full document numbers are logged (P0, S)

### 3.3 Audit and immutability

**Why:** The audit log is currently not implemented; material actions must be immutable.

- [ ] **SEC-10** Emit audit events for create, update, status change, and reveal (P1, L)
- [ ] **SEC-11** Implement read-only audit log UI with filtering and export (P1, L)
- [ ] **SEC-12** Never expose edit/delete controls on audit events (P0, S)

---

## 4. User Experience

### 4.1 Navigation and permissions

**Why:** Navigation must reflect the user's permission and geographic scope, not just role.

- [ ] **UX-1** Filter navigation items by permission and country/city scope (P1, M)
- [ ] **UX-2** Guard routes by permission and redirect unauthorized access (P1, S)
- [ ] **UX-3** Preserve requested URL through login and redirect after success (P1, S)

### 4.2 Forms and feedback

**Why:** A large admin portal needs consistent, helpful form validation and feedback.

- [ ] **UX-4** Improve field-level error messages and server error mapping (P1, M)
- [ ] **UX-5** Add loading and empty states to all list and detail pages (P1, S)
- [ ] **UX-6** Add unsaved-change warnings on form pages (P2, S)
- [ ] **UX-7** Add keyboard-accessible dialogs and focus management (P2, S)

### 4.3 Localization foundation

**Why:** i18next is recommended in the spec but not wired.

- [ ] **UX-8** Install and configure `i18next` with default English keys (P2, M)
- [ ] **UX-9** Extract all user-facing strings into translation files (P2, L)

---

## 5. Testing and Quality

### 5.1 Unit and integration tests

**Why:** Only a few tests exist; coverage is low for a financial admin app.

- [ ] **TST-1** Add tests for `AuthProvider` and permission logic (P1, M)
- [ ] **TST-2** Add tests for `httpClient` error handling (P1, M)
- [ ] **TST-3** Add tests for form schemas (`agents`, `corridors`, `settings`) (P1, S)
- [ ] **TST-4** Add MSW-driven integration tests for geography and corridors (P1, M)
- [ ] **TST-5** Add money calculation and formatting tests (P1, S)

### 5.2 End-to-end tests

**Why:** Critical workflows (login, create country, create corridor) should be covered by Playwright.

- [ ] **E2E-1** Add login and unauthorized flow tests (P1, M)
- [ ] **E2E-2** Add country create/edit and city create/edit tests (P1, M)
- [ ] **E2E-3** Add corridor create/edit and validation tests (P1, M)
- [ ] **E2E-4** Add permission-gated route tests (P1, M)

### 5.3 Static analysis

**Why:** Strict TypeScript and linting prevent common bugs.

- [ ] **QA-1** Enable strict TypeScript (`strict: true`) and fix errors (P1, M)
- [ ] **QA-2** Add ESLint rule for no-floating-promises and exhaustive deps (P1, S)
- [ ] **QA-3** Add pre-commit hook or CI step for lint/typecheck/test (P1, S)

---

## 6. DevOps and Operations

### 6.1 Build and deployment

**Why:** A Dockerfile and nginx config exist but should be hardened and documented.

- [ ] **OPS-6** Clean `dist/` and `test-results/` from repository if not intended (P1, XS)
- [ ] **OPS-7** Remove `.tmp-icons-material-incomplete` from source control (P0, XS)
- [ ] **OPS-8** Add multi-stage Dockerfile with non-root user (P2, S)
- [ ] **OPS-9** Add `.dockerignore` for `node_modules`, `dist`, `.env` (P1, XS)
- [ ] **OPS-10** Review and harden `nginx.conf` security headers (P2, S)

### 6.2 CI/CD

**Why:** The deploy workflow is minimal and should run quality gates.

- [ ] **CI-1** Add GitHub Actions job for lint, typecheck, unit tests, and build (P1, M)
- [ ] **CI-2** Add Playwright install and E2E job on PRs (P1, M)
- [ ] **CI-3** Add build artifact and container image publishing (P2, M)

---

## Suggested Phase Plan

### Phase A (stabilize)

- TH-1 through TH-4 (build/config)
- OPS-6 through OPS-10 (repo hygiene and Docker)
- QA-1 through QA-3 (strict analysis)
- SEC-1 through SEC-5 (auth hardening)

### Phase B (core features)

- AGT-1 through AGT-5 (agents)
- OUT-1, OUT-2, CSH-1, CSH-2 (outlets/cashiers)
- UX-1 through UX-3 (permission-aware navigation)

### Phase C (operations and compliance)

- OPS-1 through OPS-5 (transactions/liquidity/settlements)
- PRC-1 through PRC-3 (pricing)
- KYC-1, CMP-1, CMP-2 (compliance)

### Phase D (admin and polish)

- ADM-1 through ADM-4 (administration)
- DSH-1 through DSH-3 (real dashboard)
- UX-4 through UX-9 (UX and localization)
- E2E and coverage improvements
