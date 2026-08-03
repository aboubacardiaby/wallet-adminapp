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
import { pricingApi } from "./api";
import type { RateOverride, RateOverrideInput } from "./types";

const emptyOverride: RateOverrideInput = {
  from_currency: "USD",
  to_currency: "XOF",
  rate: 0,
  spread_pct: 0,
  note: null,
  is_active: true,
};

export function ExchangeRatePage() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: pricingApi.rates,
  });
  const [editing, setEditing] = useState<RateOverride | "new" | null>(null);
  const [form, setForm] = useState<RateOverrideInput>(emptyOverride);

  const refresh = useMutation({
    mutationFn: pricingApi.refreshRates,
    onSuccess: async () =>
      client.invalidateQueries({ queryKey: ["exchange-rates"] }),
  });
  const save = useMutation({
    mutationFn: () =>
      editing === "new"
        ? pricingApi.createOverride(form)
        : pricingApi.updateOverride((editing as RateOverride).id, form),
    onSuccess: async () => {
      setEditing(null);
      await client.invalidateQueries({ queryKey: ["exchange-rates"] });
    },
  });
  const remove = useMutation({
    mutationFn: pricingApi.deleteOverride,
    onSuccess: async () =>
      client.invalidateQueries({ queryKey: ["exchange-rates"] }),
  });

  const openOverride = (override?: RateOverride) => {
    if (override) {
      setEditing(override);
      setForm({
        from_currency: override.from_currency,
        to_currency: override.to_currency,
        rate: Number(override.rate),
        spread_pct: Number(override.spread_pct),
        note: override.note,
        is_active: override.is_active,
      });
    } else {
      setEditing("new");
      setForm(emptyOverride);
    }
  };

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
            Currency and exchange rates
          </Typography>
          <Typography color="text.secondary">
            Monitor live rates and manage database-backed overrides.
          </Typography>
        </Box>
        <Stack direction="row" gap={1}>
          <Button
            disabled={refresh.isPending}
            onClick={() => refresh.mutate()}
          >
            Refresh live rates
          </Button>
          <Button variant="contained" onClick={() => openOverride()}>
            Add override
          </Button>
        </Stack>
      </Stack>

      <ResourceState
        loading={query.isLoading}
        error={query.error}
        empty={false}
        retry={() => query.refetch()}
      />
      {refresh.data ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {refresh.data.message}
        </Alert>
      ) : null}
      {refresh.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {normalizeApiError(refresh.error).message}
        </Alert>
      ) : null}

      {query.data ? (
        <Stack spacing={3}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Live currency pairs
            </Typography>
            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Pair</TableCell>
                    <TableCell>Live rate</TableCell>
                    <TableCell>Effective rate</TableCell>
                    <TableCell>Source</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {query.data.pairs.map((pair) => (
                    <TableRow
                      key={`${pair.from_currency}-${pair.to_currency}`}
                    >
                      <TableCell>
                        {pair.from_currency} → {pair.to_currency}
                      </TableCell>
                      <TableCell>{Number(pair.live_rate).toFixed(6)}</TableCell>
                      <TableCell>
                        {Number(pair.effective_rate).toFixed(6)}
                      </TableCell>
                      <TableCell>
                        {pair.has_override ? "Manual override" : "Live market"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Card>

          <Card sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Manual overrides
            </Typography>
            {!query.data.overrides.length ? (
              <Alert severity="info">No rate overrides are configured.</Alert>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Pair</TableCell>
                      <TableCell>Rate</TableCell>
                      <TableCell>Spread</TableCell>
                      <TableCell>Note</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {query.data.overrides.map((override) => (
                      <TableRow key={override.id}>
                        <TableCell>
                          {override.from_currency} → {override.to_currency}
                        </TableCell>
                        <TableCell>{Number(override.rate)}</TableCell>
                        <TableCell>
                          {(Number(override.spread_pct) * 100).toFixed(3)}%
                        </TableCell>
                        <TableCell>{override.note || "—"}</TableCell>
                        <TableCell>
                          {override.is_active ? "Active" : "Inactive"}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row">
                            <Button onClick={() => openOverride(override)}>
                              Edit
                            </Button>
                            <Button
                              color="error"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Delete ${override.from_currency}/${override.to_currency} override?`,
                                  )
                                )
                                  remove.mutate(override.id);
                              }}
                            >
                              Delete
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
            {remove.error ? (
              <Alert severity="error">
                {normalizeApiError(remove.error).message}
              </Alert>
            ) : null}
          </Card>
        </Stack>
      ) : null}

      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editing === "new" ? "Add rate override" : "Edit rate override"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="From currency"
              value={form.from_currency}
              disabled={editing !== "new"}
              onChange={(event) =>
                setForm({
                  ...form,
                  from_currency: event.target.value.toUpperCase(),
                })
              }
            />
            <TextField
              label="To currency"
              value={form.to_currency}
              disabled={editing !== "new"}
              onChange={(event) =>
                setForm({
                  ...form,
                  to_currency: event.target.value.toUpperCase(),
                })
              }
            />
            <TextField
              label="Override rate"
              type="number"
              value={form.rate}
              onChange={(event) =>
                setForm({ ...form, rate: Number(event.target.value) })
              }
            />
            <TextField
              label="Spread (0.005 = 0.5%)"
              type="number"
              value={form.spread_pct}
              onChange={(event) =>
                setForm({ ...form, spread_pct: Number(event.target.value) })
              }
            />
            <TextField
              label="Note"
              multiline
              minRows={2}
              value={form.note || ""}
              onChange={(event) =>
                setForm({ ...form, note: event.target.value || null })
              }
            />
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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={
              save.isPending ||
              form.rate <= 0 ||
              !form.from_currency ||
              !form.to_currency
            }
            onClick={() => save.mutate()}
          >
            Save override
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
