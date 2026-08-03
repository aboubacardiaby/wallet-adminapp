import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Card,
  Drawer,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Search } from "lucide-react";
import { useState } from "react";
import { ResourceState } from "../../components/data-grid/ResourceState";
import { StatusChip } from "../../components/feedback/StatusChip";
import { userApi } from "./api";
import type { AdminUser } from "./types";

const displayName = (user: AdminUser) =>
  user.full_name || user.displayName || user.username || user.email || user.id;

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "Not provided";

const prettyLabel = (key: string) =>
  key.replaceAll("_", " ").replace(/^./, (char) => char.toUpperCase());

const formatDetailValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export function UsersListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const query = useQuery({
    queryKey: ["users", { search, status, page }],
    queryFn: () => userApi.list({ search, status, page, limit: 25 }),
  });

  const users = query.data?.users || [];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography component="h1" variant="h1">Users</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Administrator and operator accounts with access to this portal.
      </Typography>
      <Card sx={{ p: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 2, mb: 2 }}>
          <TextField
            label="Name, username, or email"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> } }}
          />
          <FormControl>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
              <MenuItem value="">All statuses</MenuItem>
              {["active", "inactive", "suspended"].map((value) => (
                <MenuItem key={value} value={value}>{value}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <ResourceState
          loading={query.isLoading}
          error={query.error}
          empty={!users.length}
          retry={() => void query.refetch()}
        />

        {users.length ? (
          <>
            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} hover onClick={() => setSelected(user)} sx={{ cursor: "pointer" }}>
                      <TableCell>
                        <Typography fontWeight={700}>{displayName(user)}</Typography>
                        {user.username && <Typography variant="caption" color="text.secondary">{user.username}</Typography>}
                      </TableCell>
                      <TableCell>{user.email || "Not provided"}</TableCell>
                      <TableCell>{user.role ? String(user.role).replaceAll("_", " ") : "Not provided"}</TableCell>
                      <TableCell>
                        {user.status ? <StatusChip status={String(user.status).toUpperCase()} /> : "Not provided"}
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <Box sx={{ mt: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                {query.data?.total ?? users.length} user{(query.data?.total ?? users.length) === 1 ? "" : "s"}
              </Typography>
              <Pagination count={query.data?.pages || 1} page={page} onChange={(_, value) => setPage(value)} />
            </Box>
          </>
        ) : null}
      </Card>

      <Drawer anchor="right" open={Boolean(selected)} onClose={() => setSelected(null)}>
        <Box sx={{ width: { xs: 320, sm: 480 }, p: 3 }}>
          <Typography variant="h2">User details</Typography>
          {selected ? (
            <Box sx={{ display: "grid", gap: 2, mt: 3 }}>
              {Object.entries(selected)
                .filter(([key]) => key !== "id")
                .map(([key, value]) => (
                  <Box key={key}>
                    <Typography variant="caption" color="text.secondary">{prettyLabel(key)}</Typography>
                    <Typography fontWeight={700} sx={{ overflowWrap: "anywhere" }}>{formatDetailValue(value)}</Typography>
                  </Box>
                ))}
            </Box>
          ) : null}
        </Box>
      </Drawer>
    </Box>
  );
}
