import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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
import { ResourceState } from "../../components/data-grid/ResourceState";
import { formatMoney } from "../../utils/money";
import { pricingApi } from "./api";
import type { FeeRule, FeeRuleInput } from "./types";

const emptyRule: FeeRuleInput = {
  name: "",
  from_currency: null,
  to_currency: null,
  fee_rate: 0.015,
  fee_flat: 0,
  min_fee: null,
  max_fee: null,
  min_amount: null,
  max_amount: null,
  priority: 0,
  is_active: true,
  note: null,
};

const numberOrNull = (value: string) =>
  value.trim() === "" ? null : Number(value);

export function FeeManagementPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["fee-rules"], queryFn: pricingApi.fees });
  const [editing, setEditing] = useState<FeeRule | "new" | null>(null);
  const [form, setForm] = useState<FeeRuleInput>(emptyRule);
  const [preview, setPreview] = useState({
    from: "USD",
    to: "XOF",
    amount: 100,
  });

  const save = useMutation({
    mutationFn: () =>
      editing === "new"
        ? pricingApi.createFee(form)
        : pricingApi.updateFee((editing as FeeRule).id!, form),
    onSuccess: async () => {
      setEditing(null);
      await client.invalidateQueries({ queryKey: ["fee-rules"] });
    },
  });
  const remove = useMutation({
    mutationFn: pricingApi.deleteFee,
    onSuccess: async () =>
      client.invalidateQueries({ queryKey: ["fee-rules"] }),
  });
  const feePreview = useMutation({
    mutationFn: () =>
      pricingApi.previewFee(preview.from, preview.to, preview.amount),
  });

  const openRule = (rule?: FeeRule) => {
    if (rule) {
      setEditing(rule);
      setForm({
        name: rule.name,
        from_currency: rule.from_currency,
        to_currency: rule.to_currency,
        fee_rate: Number(rule.fee_rate),
        fee_flat: Number(rule.fee_flat),
        min_fee: rule.min_fee === null ? null : Number(rule.min_fee),
        max_fee: rule.max_fee === null ? null : Number(rule.max_fee),
        min_amount:
          rule.min_amount === null ? null : Number(rule.min_amount),
        max_amount:
          rule.max_amount === null ? null : Number(rule.max_amount),
        priority: rule.priority,
        is_active: rule.is_active,
        note: rule.note,
      });
    } else {
      setEditing("new");
      setForm(emptyRule);
    }
  };

  const canSave =
    form.name.trim() &&
    form.fee_rate >= 0 &&
    (form.max_fee === null ||
      form.min_fee === null ||
      form.max_fee >= form.min_fee) &&
    (form.max_amount === null ||
      form.min_amount === null ||
      form.max_amount >= form.min_amount);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        gap={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography component="h1" variant="h1">
            Fee management
          </Typography>
          <Typography color="text.secondary">
            Higher-priority active rules are evaluated first.
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => openRule()}>
          Add fee rule
        </Button>
      </Stack>

      <ResourceState
        loading={query.isLoading}
        error={query.error}
        empty={false}
        retry={() => query.refetch()}
      />
      {query.data ? (
        <Stack spacing={3}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Fee rules
            </Typography>
            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rule</TableCell>
                    <TableCell>Currency corridor</TableCell>
                    <TableCell>Rate</TableCell>
                    <TableCell>Flat fee</TableCell>
                    <TableCell>Fee range</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[query.data.effective_default, ...query.data.rules].map(
                    (rule) => (
                      <TableRow key={rule.id || "default"}>
                        <TableCell>
                          <Typography fontWeight={700}>{rule.name}</Typography>
                          <Typography variant="caption">
                            {rule.note || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {rule.from_currency || "ANY"} →{" "}
                          {rule.to_currency || "ANY"}
                        </TableCell>
                        <TableCell>
                          {(Number(rule.fee_rate) * 100).toFixed(3)}%
                        </TableCell>
                        <TableCell>{Number(rule.fee_flat)}</TableCell>
                        <TableCell>
                          {rule.min_fee ?? "—"} / {rule.max_fee ?? "—"}
                        </TableCell>
                        <TableCell>{rule.priority}</TableCell>
                        <TableCell>
                          {rule.is_active ? "Active" : "Inactive"}
                        </TableCell>
                        <TableCell>
                          {!rule.is_system_default ? (
                            <Stack direction="row">
                              <Button onClick={() => openRule(rule)}>
                                Edit
                              </Button>
                              <Button
                                color="error"
                                onClick={() => {
                                  if (
                                    rule.id &&
                                    window.confirm(
                                      `Delete fee rule “${rule.name}”?`,
                                    )
                                  )
                                    remove.mutate(rule.id);
                                }}
                              >
                                Delete
                              </Button>
                            </Stack>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </Box>
            {remove.error ? (
              <Alert severity="error">
                {normalizeApiError(remove.error).message}
              </Alert>
            ) : null}
          </Card>

          <Card sx={{ p: 2 }}>
            <Typography variant="h5">Fee preview</Typography>
            <Stack
              direction={{ xs: "column", md: "row" }}
              gap={2}
              sx={{ mt: 2 }}
            >
              <TextField
                label="From currency"
                value={preview.from}
                onChange={(event) =>
                  setPreview({ ...preview, from: event.target.value.toUpperCase() })
                }
              />
              <TextField
                label="To currency"
                value={preview.to}
                onChange={(event) =>
                  setPreview({ ...preview, to: event.target.value.toUpperCase() })
                }
              />
              <TextField
                label="Amount"
                type="number"
                value={preview.amount}
                onChange={(event) =>
                  setPreview({ ...preview, amount: Number(event.target.value) })
                }
              />
              <Button
                disabled={
                  feePreview.isPending ||
                  preview.amount <= 0 ||
                  !preview.from ||
                  !preview.to
                }
                onClick={() => feePreview.mutate()}
              >
                Calculate fee
              </Button>
            </Stack>
            {feePreview.data ? (
              <Alert severity="success" sx={{ mt: 2 }}>
                Fee:{" "}
                {formatMoney(String(feePreview.data.fee), preview.from)}
                {feePreview.data.rule_name
                  ? ` — ${feePreview.data.rule_name}`
                  : ""}
              </Alert>
            ) : null}
            {feePreview.error ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                {normalizeApiError(feePreview.error).message}
              </Alert>
            ) : null}
          </Card>
        </Stack>
      ) : null}

      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editing === "new" ? "Add fee rule" : "Edit fee rule"}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: 2,
              pt: 1,
            }}
          >
            <TextField
              label="Rule name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <TextField
              label="Priority"
              type="number"
              value={form.priority}
              onChange={(event) =>
                setForm({ ...form, priority: Number(event.target.value) })
              }
            />
            <TextField
              label="From currency (blank = any)"
              value={form.from_currency || ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  from_currency: event.target.value.toUpperCase() || null,
                })
              }
            />
            <TextField
              label="To currency (blank = any)"
              value={form.to_currency || ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  to_currency: event.target.value.toUpperCase() || null,
                })
              }
            />
            <TextField
              label="Fee rate (0.015 = 1.5%)"
              type="number"
              value={form.fee_rate}
              onChange={(event) =>
                setForm({ ...form, fee_rate: Number(event.target.value) })
              }
            />
            <TextField
              label="Flat fee"
              type="number"
              value={form.fee_flat}
              onChange={(event) =>
                setForm({ ...form, fee_flat: Number(event.target.value) })
              }
            />
            {(
              [
                ["min_fee", "Minimum fee"],
                ["max_fee", "Maximum fee"],
                ["min_amount", "Minimum transfer amount"],
                ["max_amount", "Maximum transfer amount"],
              ] as const
            ).map(([field, label]) => (
              <TextField
                key={field}
                label={label}
                type="number"
                value={form[field] ?? ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    [field]: numberOrNull(event.target.value),
                  })
                }
              />
            ))}
            <TextField
              label="Note"
              multiline
              minRows={2}
              value={form.note || ""}
              onChange={(event) =>
                setForm({ ...form, note: event.target.value || null })
              }
              sx={{ gridColumn: { sm: "1 / -1" } }}
            />
          </Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.is_active}
                onChange={(event) =>
                  setForm({ ...form, is_active: event.target.checked })
                }
              />
            }
            label="Active"
          />
          {save.error ? (
            <Alert severity="error">
              {normalizeApiError(save.error).message}
            </Alert>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!canSave || save.isPending}
            onClick={() => save.mutate()}
          >
            Save fee rule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
