import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Can } from "../../auth/Can";
import { ResourceState } from "../../components/data-grid/ResourceState";
import { StatusChip } from "../../components/feedback/StatusChip";
import { formatMoney } from "../../utils/money";
import { agentApi } from "./api";
import type { Agent } from "./types";
import { DocumentManager } from "./documents/DocumentManager";

const tabs = [
  "Overview",
  "Owners & Beneficial Owners",
  "Documents",
  "Outlets",
  "Cashiers",
  "Services & Limits",
  "Liquidity",
  "Commission",
  "Settlements",
  "Compliance",
  "Audit History",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={600}>{value ?? "—"}</Typography>
    </Box>
  );
}

type WorkflowAction = "reject" | "suspend" | "terminate";

function WorkflowPanel({ agent, agentId }: { agent: Agent; agentId: string }) {
  const client = useQueryClient();
  const [pending, setPending] = useState<WorkflowAction | null>(null);
  const [reason, setReason] = useState("");
  const [dialogError, setDialogError] = useState("");

  const after = () => {
    void client.invalidateQueries({ queryKey: ["agent", agentId] });
    void client.invalidateQueries({ queryKey: ["agents"] });
    setPending(null);
    setReason("");
    setDialogError("");
  };

  const approve = useMutation({
    mutationFn: () => agentApi.approve(agentId),
    onSuccess: after,
    onError: (err: unknown) => setDialogError((err as Error)?.message || "Action failed"),
  });
  const reject = useMutation({
    mutationFn: () => agentApi.reject(agentId, reason),
    onSuccess: after,
    onError: (err: unknown) => setDialogError((err as Error)?.message || "Action failed"),
  });
  const suspend = useMutation({
    mutationFn: () => agentApi.suspend(agentId, reason),
    onSuccess: after,
    onError: (err: unknown) => setDialogError((err as Error)?.message || "Action failed"),
  });
  const activate = useMutation({
    mutationFn: () => agentApi.activate(agentId),
    onSuccess: after,
    onError: (err: unknown) => setDialogError((err as Error)?.message || "Action failed"),
  });
  const terminate = useMutation({
    mutationFn: () => agentApi.terminate(agentId, reason),
    onSuccess: after,
    onError: (err: unknown) => setDialogError((err as Error)?.message || "Action failed"),
  });

  const canReview = ["SUBMITTED", "UNDER_REVIEW", "MORE_INFORMATION_REQUIRED"].includes(agent.status);
  const canSuspend = agent.status === "ACTIVE";
  const canActivate = agent.status === "SUSPENDED";
  const canTerminate = agent.status === "ACTIVE" || agent.status === "APPROVED";

  const execute = () => {
    if (!reason.trim()) {
      setDialogError("A reason is required.");
      return;
    }
    if (pending === "reject") void reject.mutate();
    else if (pending === "suspend") void suspend.mutate();
    else if (pending === "terminate") void terminate.mutate();
  };

  const close = () => {
    setPending(null);
    setReason("");
    setDialogError("");
  };

  return (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
        <Can permission="agents.approve">
          {canReview && (
            <Button variant="contained" color="success" onClick={() => void approve.mutate()} disabled={approve.isPending}>
              Approve
            </Button>
          )}
        </Can>
        <Can permission="agents.reject">
          {canReview && (
            <Button variant="outlined" color="error" onClick={() => setPending("reject")}>
              Reject
            </Button>
          )}
        </Can>
        <Can permission="agents.suspend">
          {canSuspend && (
            <Button variant="outlined" color="warning" onClick={() => setPending("suspend")}>
              Suspend
            </Button>
          )}
          {canTerminate && (
            <Button variant="outlined" color="error" onClick={() => setPending("terminate")}>
              Terminate
            </Button>
          )}
        </Can>
        <Can permission="agents.activate">
          {canActivate && (
            <Button variant="contained" color="success" onClick={() => void activate.mutate()} disabled={activate.isPending}>
              Activate
            </Button>
          )}
        </Can>
      </Box>

      <Dialog open={Boolean(pending)} onClose={close} maxWidth="sm" fullWidth>
        <DialogTitle>{pending ? pending.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase()) : ""}</DialogTitle>
        <DialogContent>
          {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
          <TextField
            fullWidth
            multiline
            rows={3}
            label={`${pending ? pending.replaceAll("_", " ") : "Reason"} reason`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            helperText="A reason is required and will be recorded in the audit history."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button variant="contained" color="error" onClick={execute} disabled={!pending || reason.trim().length === 0}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export function AgentDetailPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [active, setActive] = useState(0);
  const query = useQuery({
    queryKey: ["agent", agentId],
    queryFn: () => agentApi.get(agentId!),
    enabled: Boolean(agentId),
  });
  const agent = query.data;

  const placeholder = (
    <Card sx={{ p: 2 }}>
      <Typography color="text.secondary">
        This section will be implemented in a later phase.
      </Typography>
    </Card>
  );

  const overview = agent ? (
    <Box>
      <Section title="Business information">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
          <Field label="Legal business name" value={agent.legalBusinessName} />
          <Field label="Trading name" value={agent.tradingName} />
          <Field label="Agent code" value={agent.agentCode} />
          <Field label="Registration number" value={agent.registrationNumber} />
          <Field label="Tax ID" value={agent.taxIdentificationNumber} />
          <Field
            label="Risk rating"
            value={
              agent.riskRating ? (
                <Chip
                  size="small"
                  label={agent.riskRating}
                  color={agent.riskRating === "LOW" ? "success" : agent.riskRating === "MEDIUM" ? "warning" : "error"}
                />
              ) : undefined
            }
          />
        </Box>
      </Section>

      <Section title="Location & contact">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
          <Field label="Country" value={agent.countryName} />
          <Field label="City" value={agent.cityName} />
          <Field
            label="Address"
            value={`${agent.addressLine1}${agent.addressLine2 ? `, ${agent.addressLine2}` : ""}`}
          />
          <Field label="Postal code" value={agent.postalCode} />
          <Field label="Contact name" value={agent.contactName} />
          <Field label="Contact email" value={agent.contactEmail} />
          <Field label="Contact phone" value={agent.contactPhone} />
        </Box>
      </Section>

      <Section title="Services & limits">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
          <Field
            label="Supported services"
            value={agent.supportedServices.map((s) => s.replaceAll("_", " ")).join(" · ")}
          />
          <Field
            label="Daily payout limit"
            value={formatMoney(agent.dailyPayoutLimit, agent.countryCurrencyCode || "XOF")}
          />
          <Field
            label="Maximum cash exposure"
            value={formatMoney(agent.maximumCashExposure, agent.countryCurrencyCode || "XOF")}
          />
          <Field
            label="Minimum liquidity threshold"
            value={formatMoney(agent.minimumLiquidityThreshold, agent.countryCurrencyCode || "XOF")}
          />
          <Field label="Commission plan" value={agent.commissionPlanId} />
        </Box>
      </Section>

      <Section title="Status">
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <StatusChip status={agent.status} />
          <Typography variant="body2" color="text.secondary">
            Version {agent.version} · Updated {new Date(agent.updatedAt).toLocaleString()}
          </Typography>
        </Box>
        <WorkflowPanel agent={agent} agentId={agent.id} />
      </Section>
    </Box>
  ) : null;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography component="h1" variant="h1">
        {agent?.legalBusinessName || "Agent details"}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {agent?.agentCode || agentId}
      </Typography>
      <Tabs value={active} onChange={(_, value) => setActive(value)} variant="scrollable" scrollButtons="auto">
        {tabs.map((tab) => (
          <Tab key={tab} label={tab} />
        ))}
      </Tabs>
      <Box sx={{ mt: 2 }}>
        <ResourceState loading={query.isLoading} error={query.error} retry={() => query.refetch()} />
        {active === 0 ? overview : active === 2 ? <DocumentManager agentId={agentId!} /> : placeholder}
      </Box>
    </Box>
  );
}
