import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { env } from "../config/env";
import { ApiError, type ProblemDetails } from "./errors";

const client = axios.create({
  baseURL: env?.apiBaseUrl,
  withCredentials: true,
  timeout: 15_000,
  headers: { Accept: "application/json" },
});
let accessToken: string | null = null;
export function setAccessToken(token: string | null) { accessToken = token; }

client.interceptors.request.use((request) => {
  request.headers["X-Correlation-ID"] =
    globalThis.crypto?.randomUUID?.() || `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  if (accessToken) request.headers.Authorization = `Bearer ${accessToken}`;
  return request;
});

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ProblemDetails>) => {
    throw new ApiError(error.response?.data || { detail: error.message }, error.response?.status);
  },
);

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await client.request<T>(config);
  return response.data;
}
