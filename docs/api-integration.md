# API integration

The Axios client targets `VITE_API_BASE_URL`, sends cookies, uses a 15-second timeout, and adds `X-Correlation-ID`. `ApiError` retains status, trace ID, and field errors without exposing stack traces.

Safe queries retry only transient failures. Mutations do not retry automatically. Future versioned mutations must send `If-Match` and handle 409/412 explicitly. 401 starts authentication and 403 shows the unauthorized page.

MSW owns local handlers in `src/mocks`. Unhandled development calls are bypassed.
