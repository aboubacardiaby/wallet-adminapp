import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, type PropsWithChildren } from "react";
import { apiRequest, setAccessToken } from "../api/httpClient";
import { currentUserSchema, type CurrentUser } from "../api/contracts";
import { env } from "../config/env";
import { permissionCodes, type Permission } from "./permissions";

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const me = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => currentUserSchema.parse(await apiRequest({ url: "/auth/me" })),
    enabled: Boolean(env?.enableApiMocks),
    retry: false,
  });

  const login = useCallback(async (credentials: { username: string; password: string }) => {
    let user: CurrentUser;
    if (env?.enableApiMocks) {
      await apiRequest({ url: "/auth/login", method: "POST", data: credentials });
      user = currentUserSchema.parse(await apiRequest({ url: "/auth/me" }));
    } else {
      const response = await apiRequest<{ access_token?: string; token?: string; role?: string; username?: string; user?: { role?: string; username?: string } }>({ url: "/admin/login", method: "POST", data: credentials });
      const accessToken = response.access_token || response.token;
      if (!accessToken) throw new Error("Login response did not include an access token.");
      setAccessToken(accessToken);
      const responseRole = response.role || response.user?.role || "";
      const responseUsername = response.username || response.user?.username || credentials.username;
      const roleMap: Record<string, CurrentUser["role"]> = { super_admin: "SUPER_ADMINISTRATOR", superadmin: "SUPER_ADMINISTRATOR", admin: "SUPER_ADMINISTRATOR", manager: "COUNTRY_MANAGER", compliance: "COMPLIANCE_OFFICER", agent_supervisor: "AGENT_OPERATIONS", viewer: "AUDITOR" };
      const limited: Record<string, Permission[]> = { compliance: ["dashboard.view", "agents.view", "documents.review", "compliance.view", "compliance.decide", "transactions.view"], viewer: ["dashboard.view", "countries.view", "cities.view", "corridors.view", "agents.view", "transactions.view", "audit.view"] };
      const role = roleMap[responseRole] || "SUPPORT_OFFICER";
      user = { id: responseUsername, displayName: responseUsername, email: `${responseUsername}@admin.local`, role, permissions: role === "SUPER_ADMINISTRATOR" ? [...permissionCodes] : (limited[responseRole] || ["dashboard.view", "transactions.view"]), scope: { countryIds: [], cityIds: [] } };
    }
    queryClient.setQueryData(["auth", "me"], user);
    if (typeof localStorage !== "undefined") localStorage.setItem("user", JSON.stringify(user));
  }, [queryClient]);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    const stored = localStorage.getItem("user");
    if (!stored || me.data) return;
    try {
      const user = currentUserSchema.parse(JSON.parse(stored));
      queryClient.setQueryData(["auth", "me"], user);
    } catch {
      localStorage.removeItem("user");
    }
  }, [queryClient, me.data]);

  const logout = useCallback(async () => {
    await apiRequest({ url: "/auth/logout", method: "POST" }).catch(() => undefined);
    setAccessToken(null);
    queryClient.removeQueries({ queryKey: ["auth", "me"] });
    if (typeof localStorage !== "undefined") localStorage.removeItem("user");
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user: me.data || null,
        isLoading: me.isLoading,
        isAuthenticated: Boolean(me.data),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
