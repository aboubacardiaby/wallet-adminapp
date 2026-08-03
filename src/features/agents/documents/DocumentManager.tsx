import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Plus } from "lucide-react";
import { Can } from "../../../auth/Can";
import { ResourceState } from "../../../components/data-grid/ResourceState";
import { StatusChip } from "../../../components/feedback/StatusChip";
import { agentDocumentApi, type AgentDocumentInput } from "./api";
import type { AgentDocument } from "../types";

const documentTypes = [
  "Business registration",
  "Tax certificate",
  "Owner identification",
  "Beneficial-owner declaration",
  "Proof of address",
  "Bank confirmation",
  "Regulatory authorization",
  "Signed agent agreement",
  "Outlet photograph",
];

export function DocumentManager({ agentId }: { agentId: string }) {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rejection, setRejection] = useState<{ document: AgentDocument; reason: string; error: string } | null>(null);
  const [form, setForm] = useState<AgentDocumentInput>({ documentType: "", fileName: "" });
  const [formError, setFormError] = useState("");

  const query = useQuery({
    queryKey: ["agent-documents", agentId],
    queryFn: () => agentDocumentApi.list(agentId),
  });

  const after = () => {
    void client.invalidateQueries({ queryKey: ["agent-documents", agentId] });
  };

  const create = useMutation({
    mutationFn: () => agentDocumentApi.create(agentId, form),
    onSuccess: () => {
      setOpen(false);
      setForm({ documentType: "", fileName: "" });
      setFormError("");
      after();
    },
    onError: (err: unknown) => setFormError((err as Error)?.message || "Upload failed"),
  });

  const approve = useMutation({
    mutationFn: (documentId: string) => agentDocumentApi.approve(agentId, documentId),
    onSuccess: after,
  });

  const reject = useMutation({
    mutationFn: () =>
      rejection ? agentDocumentApi.reject(agentId, rejection.document.id, rejection.reason) : Promise.reject(),
    onSuccess: () => {
      setRejection(null);
      after();
    },
    onError: (err: unknown) => {
      if (rejection) setRejection({ ...rejection, error: (err as Error)?.message || "Rejection failed" });
    },
  });

  const docs = query.data ?? [];

  const onCreate = () => {
    if (!form.documentType.trim() || !form.fileName.trim()) {
      setFormError("Document type and file name are required.");
      return;
    }
    void create.mutate();
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">Agent documents</Typography>
        <Can permission="agents.create">
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setOpen(true)}>
            Add document
          </Button>
        </Can>
      </Box>

      <ResourceState loading={query.isLoading} error={query.error} empty={!docs.length} retry={() => query.refetch()} />

      {docs.length ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>File</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell>Status</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {docs.map((doc) => (
              <TableRow key={doc.id} hover>
                <TableCell>{doc.documentType}</TableCell>
                <TableCell>{doc.fileName}</TableCell>
                <TableCell>{new Date(doc.uploadedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <StatusChip status={doc.status} />
                </TableCell>
                <TableCell>
                  {doc.status === "PENDING" && (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Can permission="documents.review">
                        <Button size="small" color="success" onClick={() => void approve.mutate(doc.id)} disabled={approve.isPending}>
                          Verify
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => setRejection({ document: doc, reason: "", error: "" })}
                        >
                          Reject
                        </Button>
                      </Can>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add document</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Document type</InputLabel>
            <Select
              label="Document type"
              value={form.documentType}
              onChange={(e) => setForm({ ...form, documentType: e.target.value })}
            >
              {documentTypes.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="File name"
            value={form.fileName}
            onChange={(e) => setForm({ ...form, fileName: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onCreate} disabled={create.isPending}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(rejection)} onClose={() => setRejection(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject document</DialogTitle>
        <DialogContent>
          {rejection?.error && <Alert severity="error" sx={{ mb: 2 }}>{rejection.error}</Alert>}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection reason"
            value={rejection?.reason ?? ""}
            onChange={(e) => rejection && setRejection({ ...rejection, reason: e.target.value })}
            helperText="A reason is required."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejection(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (!rejection?.reason.trim()) {
                setRejection({ ...rejection, error: "A reason is required." } as typeof rejection);
                return;
              }
              void reject.mutate();
            }}
            disabled={!rejection || !rejection.reason.trim()}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
