import { Download, Plus, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  Chip,
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
import { Link } from "react-router-dom";
import { useState } from "react";
import { Can } from "../../auth/Can";
import { ResourceState } from "../../components/data-grid/ResourceState";
import { StatusChip } from "../../components/feedback/StatusChip";
import { formatMoney } from "../../utils/money";
import { env } from "../../config/env";
import { geographyApi } from "../geography/api";
import { agentApi } from "./api";
import type { Agent, AgentRiskRating, AgentService, AgentStatus } from "./types";

const agentStatuses: AgentStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "MORE_INFORMATION_REQUIRED",
  "APPROVED",
  "ACTIVE",
  "SUSPENDED",
  "REJECTED",
  "TERMINATED",
];
const agentRiskRatings: AgentRiskRating[] = ["LOW", "MEDIUM", "HIGH"];
const agentServices: AgentService[] = ["CASH_PICKUP", "BANK_DEPOSIT", "WALLET_DEPOSIT"];

function RiskChip({ rating }: { rating?: AgentRiskRating }) {
  if (!rating) return null;
  const color = rating === "LOW" ? "success" : rating === "MEDIUM" ? "warning" : "error";
  return <Chip size="small" label={rating} color={color} />;
}

function LiquidityChip({ available, threshold }: { available?: string; threshold?: string }) {
  if (!available || !threshold) return null;
  const low = Number(available) < Number(threshold);
  return <Chip size="small" label={low ? "Low" : "OK"} color={low ? "error" : "success"} />;
}

function escapeCsv(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  if (text.includes('"') || text.includes(",") || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function downloadCsv(agents: Agent[]) {
  const headers = [
    "Agent code",
    "Legal business name",
    "Trading name",
    "Country",
    "City",
    "Contact phone",
    "Contact email",
    "Services",
    "Risk",
    "Status",
    "Daily payout limit",
    "Available payout",
    "Liquidity threshold",
  ];
  const rows = agents.map((a) =>
    [
      a.agentCode || "",
      a.legalBusinessName,
      a.tradingName || "",
      a.countryName || "",
      a.cityName || "",
      a.contactPhone,
      a.contactEmail,
      a.supportedServices.join(" · "),
      a.riskRating || "",
      a.status,
      a.dailyPayoutLimit,
      a.availablePayoutBalance || "",
      a.minimumLiquidityThreshold,
    ]
      .map(escapeCsv)
      .join(","),
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `agents-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AgentListPage() {
  const pageSize = env?.defaultPageSize || 25;
  const [search, setSearch] = useState("");
  const [countryId, setCountryId] = useState("");
  const [cityId, setCityId] = useState("");
  const [status, setStatus] = useState("");
  const [service, setService] = useState("");
  const [riskRating, setRiskRating] = useState("");
  const [page, setPage] = useState(1);

  const countries = useQuery({
    queryKey: ["countries"],
    queryFn: () => geographyApi.countries(),
  });
  const cities = useQuery({
    queryKey: ["cities", countryId],
    queryFn: () => geographyApi.cities({ countryId }),
    enabled: Boolean(countryId),
  });
  const query = useQuery({
    queryKey: ["agents", { search, countryId, cityId, status, service, riskRating, page, pageSize }],
    queryFn: () =>
      agentApi.list({
        search,
        countryId,
        cityId,
        status,
        service,
        riskRating,
        page,
        pageSize,
      }),
  });

  const agents = query.data?.items ?? [];
  const pageCount = query.data?.totalPages ?? 1;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography component="h1" variant="h1">
            Agents
          </Typography>
          <Typography color="text.secondary">Onboarded and pending agents across authorized markets.</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Can permission="agents.create">
            <Button component={Link} to="/agents/new" variant="contained" startIcon={<Plus size={16} />}>
              Onboard agent
            </Button>
          </Can>
          <Button
            variant="outlined"
            startIcon={<Download size={16} />}
            disabled={!agents.length}
            onClick={() => downloadCsv(agents)}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      <Card sx={{ p: 2 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 2,
            mb: 2,
          }}
        >
          <TextField
            label="Search agents"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <FormControl>
            <InputLabel>Country</InputLabel>
            <Select
              label="Country"
              value={countryId}
              onChange={(e) => {
                setCountryId(e.target.value);
                setCityId("");
                setPage(1);
              }}
            >
              <MenuItem value="">All countries</MenuItem>
              {countries.data?.items.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>City</InputLabel>
            <Select
              label="City"
              value={cityId}
              onChange={(e) => {
                setCityId(e.target.value);
                setPage(1);
              }}
              disabled={!countryId}
            >
              <MenuItem value="">All cities</MenuItem>
              {cities.data?.items.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All statuses</MenuItem>
              {agentStatuses.map((s) => (
                <MenuItem key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>Service</InputLabel>
            <Select
              label="Service"
              value={service}
              onChange={(e) => {
                setService(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All services</MenuItem>
              {agentServices.map((s) => (
                <MenuItem key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>Risk</InputLabel>
            <Select
              label="Risk"
              value={riskRating}
              onChange={(e) => {
                setRiskRating(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All ratings</MenuItem>
              {agentRiskRatings.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <ResourceState loading={query.isLoading} error={query.error} empty={!agents.length} retry={() => query.refetch()} />

        {agents.length ? (
          <>
            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Agent</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Services</TableCell>
                    <TableCell>Risk</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Liquidity</TableCell>
                    <TableCell>Daily payout</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent.id} hover>
                      <TableCell>
                        <Typography fontWeight={700}>{agent.legalBusinessName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {agent.agentCode || "No code"} · {agent.contactPhone}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {agent.cityName || "—"}, {agent.countryName || "—"}
                      </TableCell>
                      <TableCell>{agent.supportedServices.map((s) => s.replaceAll("_", " ")).join(" · ")}</TableCell>
                      <TableCell>
                        <RiskChip rating={agent.riskRating} />
                      </TableCell>
                      <TableCell>
                        <StatusChip status={agent.status} />
                      </TableCell>
                      <TableCell>
                        <LiquidityChip available={agent.availablePayoutBalance} threshold={agent.minimumLiquidityThreshold} />
                      </TableCell>
                      <TableCell>
                        {agent.dailyPayoutLimit
                          ? formatMoney(agent.dailyPayoutLimit, agent.countryCurrencyCode || "XOF")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Button component={Link} to={`/agents/${agent.id}`} size="small">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <Pagination
              sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}
              count={pageCount}
              page={page}
              onChange={(_, value) => setPage(value)}
            />
          </>
        ) : null}
      </Card>
    </Box>
  );
}
