import { z } from "zod";
import { permissionSchema } from "../auth/permissions";

export const userRoleSchema = z.enum([
  "SUPER_ADMINISTRATOR",
  "COUNTRY_MANAGER",
  "CITY_MANAGER",
  "AGENT_OPERATIONS",
  "COMPLIANCE_OFFICER",
  "FINANCE_OFFICER",
  "SUPPORT_OFFICER",
  "AUDITOR",
]);

export const currentUserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  permissions: z.array(permissionSchema),
  scope: z.object({ countryIds: z.array(z.string()), cityIds: z.array(z.string()) }),
});

export type CurrentUser = z.infer<typeof currentUserSchema>;
