export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly traceId?: string;
  readonly fieldErrors: Record<string, string[]>;

  constructor(problem: ProblemDetails, fallbackStatus = 500) {
    super(problem.detail || problem.title || "An unexpected service error occurred.");
    this.name = "ApiError";
    this.status = problem.status || fallbackStatus;
    this.traceId = problem.traceId;
    this.fieldErrors = problem.errors || {};
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) return new ApiError({ detail: error.message });
  return new ApiError({});
}
