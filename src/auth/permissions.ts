import { z } from "zod";

export const permissionCodes = [
  "dashboard.view", "countries.view", "countries.manage", "cities.view", "cities.manage",
  "corridors.view", "corridors.manage", "agents.view", "agents.create", "agents.update",
  "agents.submit", "agents.approve", "agents.reject", "agents.suspend", "agents.activate",
  "outlets.manage", "cashiers.manage", "documents.review", "compliance.view",
  "compliance.decide", "liquidity.view", "liquidity.adjust", "commissions.view",
  "commissions.manage", "transactions.view", "transactions.hold", "transactions.release",
  "settlements.view", "settlements.manage", "reconciliation.manage", "users.view",
  "users.manage", "roles.manage", "audit.view",
] as const;

export const permissionSchema = z.enum(permissionCodes);
export type Permission = z.infer<typeof permissionSchema>;

export function hasPermission(
  granted: readonly Permission[],
  required?: Permission | readonly Permission[],
): boolean {
  if (!required) return true;
  const requested = Array.isArray(required) ? required : [required];
  return requested.every((permission) => granted.includes(permission));
}
