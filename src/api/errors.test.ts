import { expect, it } from "vitest";
import { ApiError, normalizeApiError } from "./errors";

it("maps problem details and field errors", () => {
  const error = new ApiError({ status: 400, detail: "Invalid", traceId: "trace-1", errors: { cityId: ["Inactive"] } });
  expect(error.status).toBe(400);
  expect(error.traceId).toBe("trace-1");
  expect(error.fieldErrors.cityId).toEqual(["Inactive"]);
});

it("normalizes unknown failures safely", () => {
  expect(normalizeApiError(null).message).toBe("An unexpected service error occurred.");
});
