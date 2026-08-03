import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { hasPermission, type Permission } from "./permissions";

export function RequirePermission({ permission }: { permission: Permission | Permission[] }) {
  const { user } = useAuth();
  return user && hasPermission(user.permissions, permission) ? <Outlet /> : <Navigate to="/unauthorized" replace />;
}
