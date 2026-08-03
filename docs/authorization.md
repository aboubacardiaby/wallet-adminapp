# Authorization

`GET /api/v1/auth/me` supplies identity, role, permissions, and geographic scope. `RequireAuth` preserves the requested path. `RequirePermission` guards routes, `Can` guards local actions, and navigation uses the same checks.

These controls are not security enforcement. Every backend endpoint must validate the session, permission, geographic scope, state, version, and maker-checker constraints.

Production should use OIDC Authorization Code with PKCE and a BFF-managed HTTP-only SameSite cookie. No long-lived token is stored in local storage.
