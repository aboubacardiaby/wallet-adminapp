# Remittance Agent Administration Portal

Permission-scoped remittance-agent administration portal with geography, corridor, transaction activity, KYC review, and system/SMTP settings connected through the wallet backend API schema.

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Chromium installed by Playwright for end-to-end tests

## Install and run

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

`VITE_ENABLE_API_MOCKS=true` starts MSW in the browser. The login page offers scoped mock identities for Super Administrator, Country Manager, Compliance Officer, Finance Officer, and Auditor.

## Environment

| Variable | Purpose |
| --- | --- |
| `VITE_APP_NAME` | Configurable product name |
| `VITE_API_BASE_URL` | API root |
| `VITE_AUTHORITY_URL` | Production OIDC authority |
| `VITE_AUTH_CLIENT_ID` | Public OIDC client identifier |
| `VITE_AUTH_REDIRECT_URI` | OIDC callback |
| `VITE_ENABLE_API_MOCKS` | Enables browser API mocks |
| `VITE_DEFAULT_PAGE_SIZE` | Default server-page size |

Never put client secrets or production credentials in Vite environment variables; they are public in the browser bundle.

## Validation

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

## Project structure

The feature-based code lives under `src/`: application wiring in `app`, typed transport in `api`, session and permissions in `auth`, shared UI in `components`, domain screens in `features`, environment parsing in `config`, MSW in `mocks`, and tests beside covered code.

## Authentication and permissions

The frontend requests `/auth/me` with cookies and does not persist tokens in local storage. Production should use OIDC Authorization Code with PKCE backed by secure HTTP-only SameSite cookies through a BFF. Mock login exists only locally. Backend authorization and geographic scope remain mandatory.

## API, money, and time

The client sends correlation IDs, normalizes Problem Details, maps field errors, and does not retry mutations. Monetary values enter helpers as decimal strings and render with a currency code. API timestamps must be UTC ISO 8601 and displayed in the applicable timezone.

## Known limitations

- Phases 1–2 supply the foundation and geography/corridor workflows; remaining operational domains are placeholders.
- Production OIDC wiring depends on the selected identity provider/BFF.
- Dashboard values are illustrative.
- Agent onboarding, settlements, pricing, liquidity, and broader compliance case workflows belong to later phases.

See the `docs/` directory for architecture, authorization, API, money/timezone, and testing details.
