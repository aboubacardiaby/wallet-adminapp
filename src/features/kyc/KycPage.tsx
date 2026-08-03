import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { normalizeApiError } from "../../api/errors";
import { useAuth } from "../../auth/AuthProvider";
import { ResourceState } from "../../components/data-grid/ResourceState";
import { StatusChip } from "../../components/feedback/StatusChip";
import { kycApi } from "./api";
import type { KycSubmission } from "./types";

const maskId = (value: string) =>
  value.length > 4 ? `••••••${value.slice(-4)}` : "••••";

const formatValue = (value?: string | null) => value?.trim() || "Not provided";

const isPdf = (url: string) =>
  url.startsWith("data:application/pdf") ||
  /\.pdf(?:$|[?#])/i.test(url);

function DetailField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <Box>
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography sx={{ overflowWrap: "anywhere" }}>
        {formatValue(value)}
      </Typography>
    </Box>
  );
}

function DocumentPreview({
  label,
  url,
}: {
  label: string;
  url?: string | null;
}) {
  if (!url) {
    return (
      <Card variant="outlined" sx={{ p: 2, minHeight: 150 }}>
        <Typography fontWeight={600}>{label}</Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          No document was submitted.
        </Alert>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1.5 }}
      >
        <Typography fontWeight={600}>{label}</Typography>
        <Link href={url} target="_blank" rel="noreferrer">
          Open full size
        </Link>
      </Stack>
      {isPdf(url) ? (
        <Box
          component="iframe"
          src={url}
          title={`${label} PDF`}
          sx={{ width: "100%", height: 360, border: 0 }}
        />
      ) : (
        <Box
          component="img"
          src={url}
          alt={label}
          sx={{
            width: "100%",
            height: 300,
            objectFit: "contain",
            bgcolor: "grey.100",
            borderRadius: 1,
          }}
        />
      )}
    </Card>
  );
}

export function KycPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<KycSubmission | null>(null);
  const [action, setAction] = useState<"approve" | "reject">("approve");
  const [reason, setReason] = useState("");

  const query = useQuery({
    queryKey: ["kyc", status],
    queryFn: () => kycApi.list({ kyc_status: status, page: 1, limit: 50 }),
  });
  const review = useMutation({
    mutationFn: () =>
      kycApi.review(selected!.id, {
        action,
        rejection_reason: action === "reject" ? reason : undefined,
        reviewer_id: user?.id || "admin",
      }),
    onSuccess: async () => {
      setSelected(null);
      setReason("");
      await client.invalidateQueries({ queryKey: ["kyc"] });
    },
  });

  const closeDetails = () => {
    if (!review.isPending) {
      setSelected(null);
      setReason("");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography component="h1" variant="h1">
        KYC review queue
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Inspect submitted identity information and documents before recording an
        authorized review decision.
      </Typography>
      <Card sx={{ p: 2 }}>
        <TextField
          select
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          sx={{ minWidth: 220, mb: 2 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {["pending", "under_review", "verified", "rejected"].map((value) => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </TextField>
        <ResourceState
          loading={query.isLoading}
          error={query.error}
          empty={!query.data?.submissions.length}
        />
        {query.data?.submissions.length ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Applicant</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Document</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {query.data.submissions.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.full_name || item.user_name}
                    <Typography variant="caption" display="block">
                      {item.user_phone}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {item.city}, {item.country}
                  </TableCell>
                  <TableCell>
                    {item.id_type}
                    <Typography variant="caption" display="block">
                      {maskId(item.id_number)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(item.submitted_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={item.status.toUpperCase()} />
                  </TableCell>
                  <TableCell>
                    <Button onClick={() => setSelected(item)}>
                      View details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </Card>

      <Dialog
        open={Boolean(selected)}
        onClose={closeDetails}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          KYC details — {selected?.full_name || selected?.user_name}
        </DialogTitle>
        {selected ? (
          <DialogContent>
            <Stack spacing={3}>
              <Box>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  gap={1}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6">Applicant information</Typography>
                  <StatusChip status={selected.status.toUpperCase()} />
                </Stack>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, 1fr)",
                      md: "repeat(3, 1fr)",
                    },
                    gap: 2,
                  }}
                >
                  <DetailField label="Full name" value={selected.full_name} />
                  <DetailField
                    label="Phone number"
                    value={selected.user_phone}
                  />
                  <DetailField
                    label="Date of birth"
                    value={selected.date_of_birth}
                  />
                  <DetailField
                    label="Nationality"
                    value={selected.nationality}
                  />
                  <DetailField label="Address" value={selected.address} />
                  <DetailField label="City" value={selected.city} />
                  <DetailField label="Region" value={selected.region} />
                  <DetailField label="Country" value={selected.country} />
                  <DetailField label="ID type" value={selected.id_type} />
                  <DetailField label="ID number" value={selected.id_number} />
                  <DetailField label="ID expiry" value={selected.id_expiry} />
                  <DetailField
                    label="Submitted"
                    value={new Date(selected.submitted_at).toLocaleString()}
                  />
                  {selected.reviewed_by ? (
                    <DetailField
                      label="Reviewed by"
                      value={selected.reviewed_by}
                    />
                  ) : null}
                  {selected.reviewed_at ? (
                    <DetailField
                      label="Reviewed"
                      value={new Date(selected.reviewed_at).toLocaleString()}
                    />
                  ) : null}
                  {selected.rejection_reason ? (
                    <DetailField
                      label="Rejection reason"
                      value={selected.rejection_reason}
                    />
                  ) : null}
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Submitted documents
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: 2,
                  }}
                >
                  <DocumentPreview
                    label="Identity document — front"
                    url={selected.id_front_url}
                  />
                  <DocumentPreview
                    label="Identity document — back"
                    url={selected.id_back_url}
                  />
                  <DocumentPreview
                    label="Applicant selfie"
                    url={selected.selfie_url}
                  />
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Review decision
                </Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Approval or rejection is recorded as an authorized workflow
                  decision.
                </Alert>
                <TextField
                  select
                  fullWidth
                  label="Decision"
                  value={action}
                  onChange={(event) =>
                    setAction(event.target.value as "approve" | "reject")
                  }
                >
                  <MenuItem value="approve">Approve</MenuItem>
                  <MenuItem value="reject">Reject</MenuItem>
                </TextField>
                {action === "reject" ? (
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Required rejection reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    sx={{ mt: 2 }}
                  />
                ) : null}
                {review.error ? (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {normalizeApiError(review.error).message}
                  </Alert>
                ) : null}
              </Box>
            </Stack>
          </DialogContent>
        ) : null}
        <DialogActions>
          <Button onClick={closeDetails}>Close</Button>
          <Button
            variant="contained"
            color={action === "reject" ? "error" : "primary"}
            disabled={
              review.isPending || (action === "reject" && !reason.trim())
            }
            onClick={() => review.mutate()}
          >
            {review.isPending ? "Saving…" : "Confirm decision"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
