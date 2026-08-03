# Testing

Vitest and React Testing Library cover permissions, route authentication, mock login return paths, API error mapping, and money formatting. MSW Node supplies deterministic API responses.

Playwright contains a smoke path that signs in and verifies permission-aware navigation.

```powershell
npm test
npx playwright install chromium
npm run test:e2e
```

Later phases add the integration and role-based end-to-end scenarios in the product specification.
