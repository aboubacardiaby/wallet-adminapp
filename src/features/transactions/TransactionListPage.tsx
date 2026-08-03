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
  Drawer,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
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
import { normalizeApiError } from "../../api/errors";
import { ResourceState } from "../../components/data-grid/ResourceState";
import { StatusChip } from "../../components/feedback/StatusChip";
import { formatMoney } from "../../utils/money";
import { transactionApi } from "./api";
import type { Transaction, TransferNotifyPayload } from "./types";

const mask = (value?: string | null) =>
  value ? `${value.slice(0, 4)}••••${value.slice(-2)}` : "—";

const extraText = (transaction: Transaction, key: string) => {
  const value = transaction.extra_data?.[key];
  return typeof value === "string" && value.trim() ? value : undefined;
};

const cashPickupDetails = (transaction: Transaction) => {
  if (transaction.type !== "cash_pickup") return null;
  return {
    agent:
      extraText(transaction, "agent_name") ||
      extraText(transaction, "agent_business_name") ||
      "Unassigned",
    city: extraText(transaction, "agent_city") || "Not provided",
    country: extraText(transaction, "agent_country") || "Not provided",
    address: extraText(transaction, "agent_address"),
    phone: extraText(transaction, "agent_phone"),
  };
};

const buildTransferNotifyPayload = (transaction: Transaction): TransferNotifyPayload => {
  const extra = (transaction.extra_data ?? {}) as Record<string, unknown>;
  const asNumber = (value: unknown) => (typeof value === "number" ? value : value === undefined || value === null ? null : Number(value));
  return {
    recipient_type: "sender",
    transfer_type: transaction.type,
    transaction_ref: transaction.transaction_ref,
    send_amount: asNumber(extra.send_amount ?? transaction.amount),
    send_currency: (extra.send_currency as string | undefined) || transaction.currency,
    fee: asNumber(extra.fee ?? transaction.fee),
    received_amount: asNumber(extra.received_amount ?? null),
    recv_currency: (extra.recv_currency as string | undefined) || transaction.currency,
    recipient_name: transaction.recipient_name || (extra.recipient_name as string | undefined) || null,
    exchange_rate: asNumber(extra.exchange_rate ?? null),
    pickup_code: (extra.pickup_code as string | undefined) || null,
  };
};

export function TransactionListPage() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [pickupAction, setPickupAction] = useState<
    "confirm" | "cancel" | null
  >(null);
  const [pickupCode, setPickupCode] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const query = useQuery({
    queryKey: [
      "transactions",
      { search, status, type, destinationCountry, page },
    ],
    queryFn: () =>
      transactionApi.list({
        search,
        status,
        type,
        destination_country: destinationCountry,
        page,
        limit: 20,
      }),
  });
  const countriesQuery = useQuery({
    queryKey: ["transaction-destination-countries"],
    queryFn: transactionApi.destinationCountries,
  });
  const processPickup = useMutation({
    mutationFn: () =>
      transactionApi.processCashPickup(selected!.id, {
        action: pickupAction!,
        pickup_code: pickupAction === "confirm" ? pickupCode.trim() : undefined,
        admin_notes: adminNotes.trim() || undefined,
      }),
    onSuccess: async (result) => {
      if (pickupAction === "confirm" && result.transaction) {
        try {
          const notify = await transactionApi.sendTransferNotification(
            buildTransferNotifyPayload(result.transaction),
          );
          setActionMessage(`${result.message} ${notify.message || "Receipt emailed to sender."}`);
        } catch {
          setActionMessage(result.message);
        }
      } else {
        setActionMessage(result.message);
      }
      setPickupAction(null);
      setPickupCode("");
      setAdminNotes("");
      setSelected(null);
      await client.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const closePickupAction = () => {
    if (processPickup.isPending) return;
    setPickupAction(null);
    setPickupCode("");
    setAdminNotes("");
    processPickup.reset();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography component="h1" variant="h1">
        Transaction activity
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Investigate immutable transaction records from the connected wallet
        database.
      </Typography>
      <Card sx={{ p: 2 }}>
        {actionMessage ? (
          <Alert
            severity="success"
            onClose={() => setActionMessage("")}
            sx={{ mb: 2 }}
          >
            {actionMessage}
          </Alert>
        ) : null}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "2fr 1fr 1fr 1fr",
            },
            gap: 2,
            mb: 2,
          }}
        >
          <TextField
            label="Reference or phone"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
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
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All</MenuItem>
              {[
                "pending",
                "processing",
                "completed",
                "failed",
                "ready_for_pickup",
                "picked_up",
                "cancelled",
              ].map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>Type</InputLabel>
            <Select
              label="Type"
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All</MenuItem>
              {[
                "transfer",
                "cash_in",
                "cash_out",
                "cash_pickup",
                "bank_deposit",
                "wallet_deposit",
              ].map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>Destination country</InputLabel>
            <Select
            label="Destination country"
            value={destinationCountry}
            onChange={(event) => {
              setDestinationCountry(event.target.value);
              setPage(1);
            }}
            disabled={countriesQuery.isLoading}
          >
            <MenuItem value="">All countries</MenuItem>
            {(countriesQuery.data?.countries || []).map((country) => (
              <MenuItem key={country.id} value={country.name}>
                {country.name}
              </MenuItem>
            ))}
          </Select>
          </FormControl>
        </Box>
        <ResourceState
          loading={query.isLoading}
          error={query.error}
          empty={!query.data?.transactions.length}
          retry={() => query.refetch()}
        />
        {query.data?.transactions.length ? (
          <>
            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Reference</TableCell>
                    <TableCell>Movement</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Destination country</TableCell>
                    <TableCell>Agent</TableCell>
                    <TableCell>Pickup location</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {query.data.transactions.map((transaction) => {
                    const pickup = cashPickupDetails(transaction);
                    return (
                      <TableRow
                        key={transaction.id}
                        hover
                        onClick={() => setSelected(transaction)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>{transaction.transaction_ref}</TableCell>
                        <TableCell>
                          {transaction.sender_name ||
                            mask(transaction.from_phone)}{" "}
                          →{" "}
                          {transaction.recipient_name ||
                            mask(transaction.to_phone)}
                        </TableCell>
                        <TableCell>{transaction.type}</TableCell>
                        <TableCell>
                          {transaction.destination_country || "Not provided"}
                        </TableCell>
                        <TableCell>{pickup?.agent || "—"}</TableCell>
                        <TableCell>
                          {pickup ? `${pickup.city}, ${pickup.country}` : "—"}
                        </TableCell>
                        <TableCell>
                          {formatMoney(
                            String(transaction.amount),
                            transaction.currency,
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusChip
                            status={transaction.status.toUpperCase()}
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
            <Pagination
              count={query.data.pages || 1}
              page={page}
              onChange={(_, value) => setPage(value)}
              sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}
            />
          </>
        ) : null}
      </Card>
      <Drawer
        anchor="right"
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      >
        <Box sx={{ width: { xs: 320, sm: 480 }, p: 3 }}>
          <Typography variant="h2">Transaction details</Typography>
          {selected ? (
            <Box sx={{ display: "grid", gap: 2, mt: 3 }}>
              {[
                ["Reference", selected.transaction_ref],
                ["Type", selected.type],
                [
                  "Destination country",
                  selected.destination_country || "Not provided",
                ],
                ["Status", selected.status],
                ["Sender", selected.sender_name || mask(selected.from_phone)],
                ["Sender email", selected.sender_email || "Not provided"],
                [
                  "Recipient",
                  selected.recipient_name || mask(selected.to_phone),
                ],
                [
                  "Amount",
                  formatMoney(String(selected.amount), selected.currency),
                ],
                ["Fee", formatMoney(String(selected.fee), selected.currency)],
                [
                  "Total",
                  formatMoney(String(selected.total_amount), selected.currency),
                ],
                ...(cashPickupDetails(selected)
                  ? [
                      ["Pickup agent", cashPickupDetails(selected)!.agent],
                      ["Pickup city", cashPickupDetails(selected)!.city],
                      ["Pickup country", cashPickupDetails(selected)!.country],
                      [
                        "Agent address",
                        cashPickupDetails(selected)!.address || "Not provided",
                      ],
                      [
                        "Agent phone",
                        cashPickupDetails(selected)!.phone || "Not provided",
                      ],
                    ]
                  : []),
                ["Description", selected.description || "—"],
                ["Created", new Date(selected.created_at).toLocaleString()],
              ].map(([label, value]) => (
                <Box key={label}>
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography fontWeight={700}>{value}</Typography>
                </Box>
              ))}
              {selected.type === "cash_pickup" &&
              !["picked_up", "completed", "cancelled", "failed"].includes(
                selected.status,
              ) ? (
                <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => setPickupAction("confirm")}
                  >
                    Pay recipient
                  </Button>
                  <Button
                    color="error"
                    onClick={() => setPickupAction("cancel")}
                  >
                    Cancel pickup
                  </Button>
                </Stack>
              ) : null}
            </Box>
          ) : null}
        </Box>
      </Drawer>
      <Dialog
        open={Boolean(pickupAction)}
        onClose={closePickupAction}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {pickupAction === "confirm"
            ? "Confirm cash payout"
            : "Cancel cash pickup"}
        </DialogTitle>
        <DialogContent>
          {pickupAction === "confirm" ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Verify the recipient’s identity and enter the six-digit pickup
              code before handing over the money. This action cannot be
              reversed.
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Cancelling prevents this pickup from being paid.
            </Alert>
          )}
          {selected ? (
            <Box sx={{ mb: 2 }}>
              <Typography fontWeight={700}>
                {selected.recipient_name || mask(selected.to_phone)}
              </Typography>
              <Typography variant="h5">
                {formatMoney(String(selected.amount), selected.currency)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {cashPickupDetails(selected)?.agent} —{" "}
                {cashPickupDetails(selected)?.city},{" "}
                {cashPickupDetails(selected)?.country}
              </Typography>
            </Box>
          ) : null}
          {pickupAction === "confirm" ? (
            <TextField
              autoFocus
              fullWidth
              label="Six-digit pickup code"
              value={pickupCode}
              onChange={(event) =>
                setPickupCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputProps={{ inputMode: "numeric", maxLength: 6 }}
              sx={{ mb: 2 }}
            />
          ) : null}
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={
              pickupAction === "cancel"
                ? "Cancellation reason"
                : "Processing notes (optional)"
            }
            value={adminNotes}
            onChange={(event) => setAdminNotes(event.target.value)}
          />
          {processPickup.error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {normalizeApiError(processPickup.error).message}
            </Alert>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePickupAction}>Back</Button>
          <Button
            variant="contained"
            color={pickupAction === "confirm" ? "success" : "error"}
            disabled={
              processPickup.isPending ||
              (pickupAction === "confirm" && pickupCode.length !== 6) ||
              (pickupAction === "cancel" && !adminNotes.trim())
            }
            onClick={() => processPickup.mutate()}
          >
            {processPickup.isPending
              ? "Processing…"
              : pickupAction === "confirm"
                ? "Confirm money paid"
                : "Confirm cancellation"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
