import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert, Box, Button, Card, CardContent, Checkbox, FormControlLabel,
  Grid, Tab, Tabs, TextField, Typography,
} from "@mui/material";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { normalizeApiError } from "../../api/errors";
import { ResourceState } from "../../components/data-grid/ResourceState";
import { settingsApi } from "./api";
import { ApiIntegrationSettings } from "./ApiIntegrationSettings";
import { appSettingsSchema, smtpSchema } from "./schemas";
import type { AppSettings, SmtpSettings } from "./types";

const appDefaults: AppSettings = {
  transfer_fee_rate: 0, daily_limit_default: 0, monthly_limit_default: 0,
  min_transfer_amount: 0, max_transfer_amount: 0, maintenance_mode: false,
  kyc_required: false, support_email: "", app_name: "",
};
const smtpDefaults: SmtpSettings = {
  host: "smtp.gmail.com", port: 587, username: "", password: "", from_email: "", from_name: "",
  use_tls: true, use_ssl: false, enabled: false,
};

export function SettingsPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["settings"], queryFn: settingsApi.get });
  const smtp = useQuery({ queryKey: ["smtp-settings"], queryFn: settingsApi.smtp });
  const appForm = useForm<AppSettings>({ resolver: zodResolver(appSettingsSchema), values: query.data || appDefaults });
  const smtpForm = useForm<SmtpSettings>({ resolver: zodResolver(smtpSchema), values: smtp.data || smtpDefaults });
  const [testEmail, setTestEmail] = useState("");
  const [tab, setTab] = useState(0);
  const save = useMutation({ mutationFn: settingsApi.save, onSuccess: async () => client.invalidateQueries({ queryKey: ["settings"] }) });
  const saveSmtp = useMutation({ mutationFn: settingsApi.saveSmtp, onSuccess: async () => client.invalidateQueries({ queryKey: ["smtp-settings"] }) });
  const test = useMutation({ mutationFn: () => settingsApi.testSmtp(testEmail) });

  if (query.isLoading || smtp.isLoading) return <Box sx={{ p: 4 }}><ResourceState loading /></Box>;
  const appInput = (name: keyof AppSettings, label: string, type = "text") => (
    <Controller name={name} control={appForm.control} render={({ field, fieldState }) => (
      <TextField {...field} type={type} label={label} error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
    )} />
  );

  return <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100 }}>
    <Typography component="h1" variant="h1">System configuration</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>Settings use the authorized backend API; database credentials never reach the browser.</Typography>
    <Card><Tabs value={tab} onChange={(_, value) => setTab(value)}><Tab label="Application" /><Tab label="SMTP email" /><Tab label="API integrations" /></Tabs>
      <CardContent>{tab === 0 ? (
        <Box component="form" onSubmit={appForm.handleSubmit(value => save.mutate(value))}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>{appInput("app_name", "Application name")}</Grid>
            <Grid size={{ xs: 12, md: 6 }}>{appInput("support_email", "Support email")}</Grid>
            {(["transfer_fee_rate", "daily_limit_default", "monthly_limit_default", "min_transfer_amount", "max_transfer_amount"] as const).map(name => (
              <Grid key={name} size={{ xs: 12, md: 4 }}>{appInput(name, name.replaceAll("_", " "), "number")}</Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 2 }}>{(["maintenance_mode", "kyc_required"] as const).map(name => (
            <Controller key={name} name={name} control={appForm.control} render={({ field }) => (
              <FormControlLabel control={<Checkbox checked={field.value} onChange={e => field.onChange(e.target.checked)} />} label={name.replaceAll("_", " ")} />
            )} />
          ))}</Box>
          {save.error && <Alert severity="error">{normalizeApiError(save.error).message}</Alert>}
          <Button type="submit" variant="contained" disabled={save.isPending} sx={{ mt: 2 }}>Save application settings</Button>
        </Box>
      ) : tab === 1 ? (
        <Box component="form" onSubmit={smtpForm.handleSubmit(value => saveSmtp.mutate(value))}>
          {smtp.data?.source === "env" && <Alert severity="info" sx={{ mb: 2 }}>Backend environment variables override database SMTP settings.</Alert>}
          <Alert severity="info" sx={{ mb: 2 }}>Save before testing a connection. The test uses the stored backend configuration, not unsaved form values.</Alert>
          <Grid container spacing={2}>
            {(["host", "username", "from_email", "from_name"] as const).map(name => (
              <Grid key={name} size={{ xs: 12, md: 6 }}><Controller name={name} control={smtpForm.control} render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label={name.replaceAll("_", " ")} error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
              )} /></Grid>
            ))}
            <Grid size={{ xs: 12, md: 3 }}><Controller name="port" control={smtpForm.control} render={({ field }) => <TextField {...field} type="number" label="Port" />} /></Grid>
            <Grid size={{ xs: 12, md: 9 }}><Controller name="password" control={smtpForm.control} render={({ field }) => <TextField {...field} fullWidth type="password" label="Password" helperText="Masked value keeps the stored backend secret." />} /></Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>{(["use_tls", "use_ssl", "enabled"] as const).map(name => (
            <Controller key={name} name={name} control={smtpForm.control} render={({ field }) => (
              <FormControlLabel control={<Checkbox checked={field.value} onChange={e => field.onChange(e.target.checked)} />} label={name.replaceAll("_", " ")} />
            )} />
          ))}</Box>
          {saveSmtp.error && <Alert severity="error">{normalizeApiError(saveSmtp.error).message}</Alert>}
          <Button type="submit" variant="contained" disabled={saveSmtp.isPending}>Save SMTP settings</Button>
          <Box sx={{ display: "flex", gap: 1, mt: 3 }}><TextField label="Test recipient" type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} /><Button disabled={!testEmail || test.isPending} onClick={() => test.mutate()}>Send test email</Button></Box>
          {test.data && <Alert severity="success" sx={{ mt: 2 }}>{test.data.message}</Alert>}
          {test.error && <Alert severity="error" sx={{ mt: 2 }}>{normalizeApiError(test.error).message}</Alert>}
        </Box>
      ) : <ApiIntegrationSettings />}</CardContent>
    </Card>
  </Box>;
}
