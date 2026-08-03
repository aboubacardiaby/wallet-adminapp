import { z } from "zod";

const schema = z.object({
  VITE_APP_NAME: z.string().min(1).default("Remittance Agent Administration Portal"),
  VITE_API_BASE_URL: z.string().url().default("http://localhost:8080/api/v1"),
  VITE_AUTHORITY_URL: z.string().default(""),
  VITE_AUTH_CLIENT_ID: z.string().default(""),
  VITE_AUTH_REDIRECT_URI: z.string().url().default("http://localhost:5173/auth/callback"),
  VITE_ENABLE_API_MOCKS: z.enum(["true", "false"]).default("false"),
  VITE_DEFAULT_PAGE_SIZE: z.coerce.number().int().positive().default(25),
});

const result = schema.safeParse(import.meta.env);

export const env = result.success
  ? {
      appName: result.data.VITE_APP_NAME,
      apiBaseUrl: result.data.VITE_API_BASE_URL.replace(/\/$/, ""),
      authorityUrl: result.data.VITE_AUTHORITY_URL,
      authClientId: result.data.VITE_AUTH_CLIENT_ID,
      authRedirectUri: result.data.VITE_AUTH_REDIRECT_URI,
      enableApiMocks: result.data.VITE_ENABLE_API_MOCKS === "true",
      defaultPageSize: result.data.VITE_DEFAULT_PAGE_SIZE,
    }
  : null;

export const envError = result.success ? null : result.error.flatten().fieldErrors;
