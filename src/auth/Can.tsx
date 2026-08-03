import type { PropsWithChildren } from "react";
import { useAuth } from "./AuthProvider";
import { hasPermission, type Permission } from "./permissions";

export function Can({ permission, children }: PropsWithChildren<{ permission: Permission | Permission[] }>) {
  const { user } = useAuth();
  return user && hasPermission(user.permissions, permission) ? children : null;
}
