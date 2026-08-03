import { apiRequest } from "../../api/httpClient";
import type { AdminUserPage } from "./types";

export const userApi = {
  list: (params: Record<string, unknown>) =>
    apiRequest<AdminUserPage>({ url: "/admin/users", params }),
};
