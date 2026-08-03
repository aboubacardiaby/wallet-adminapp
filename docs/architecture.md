# Architecture

The portal uses React 18, strict TypeScript, Vite, Material UI, React Router, TanStack Query, React Hook Form, and Zod. `AppProviders` owns theme, query, routing, and authentication providers. `AppRouter` defines protected routes; `AppShell` filters navigation with the same permission codes.

Server state belongs in TanStack Query. Forms use React Hook Form plus Zod. Domain features stay isolated beneath `src/features/<feature>` as later phases arrive. Global render failures are contained by an error boundary, while API failures use normalized Problem Details.

Phase 1 provides placeholder pages for later routes instead of prematurely encoding domain policy.
