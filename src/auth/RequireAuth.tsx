import { CircularProgress, Stack } from "@mui/material";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function RequireAuth() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isLoading) {
    return <Stack sx={{ minHeight: "100vh", alignItems: "center", justifyContent: "center" }}><CircularProgress /></Stack>;
  }
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}
