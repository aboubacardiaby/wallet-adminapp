export interface AdminUser {
  id: string;
  username?: string | null;
  full_name?: string | null;
  displayName?: string | null;
  email?: string | null;
  role?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  country?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_login_at?: string | null;
  [key: string]: unknown;
}

export interface AdminUserPage {
  users: AdminUser[];
  total: number;
  page: number;
  pages: number;
}
