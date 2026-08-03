import { Chip } from "@mui/material";

export function StatusChip({ status }: { status: string }) {
  const color =
    status === "ACTIVE" || status === "APPROVED" || status === "VERIFIED"
      ? "success"
      : status === "SUSPENDED" || status === "REJECTED" || status === "TERMINATED"
        ? "error"
        : status === "DRAFT" || status === "PENDING"
          ? "default"
          : "warning";
  return <Chip size="small" label={status.replaceAll("_", " ")} color={color} variant={color === "default" ? "outlined" : "filled"} />;
}
