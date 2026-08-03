import { describe, expect, it } from "vitest";
import { hasPermission, type Permission } from "./permissions";

describe("hasPermission", () => {
  const granted: Permission[] = ["dashboard.view", "countries.view"];
  it("accepts a granted permission", () => expect(hasPermission(granted, "dashboard.view")).toBe(true));
  it("rejects a missing permission", () => expect(hasPermission(granted, "roles.manage")).toBe(false));
  it("requires every permission in a set", () => expect(hasPermission(granted, ["dashboard.view", "roles.manage"])).toBe(false));
});
