import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { normalizeApiError } from "../../api/errors";
import { ResourceState } from "../../components/data-grid/ResourceState";
import { settingsApi } from "./api";
import { achSchema, waveSchema } from "./schemas";
import type { AchSettings, WaveSettings } from "./types";

const waveDefaults: WaveSettings = {
  api_base_url: "https://api.wave.com",
  api_key: "",
  business_country: "Senegal",
  business_currency: "XOF",
  aggregated_merchant_id: "",
  verify_recipient: true,
  enabled: false,
};

const achDefaults: AchSettings = {
  api_base_url: "http://localhost:3000/v1",
  api_key: "",
  platform_account_number: "",
  platform_routing_number: "",
  platform_account_type: "CHECKING",
  platform_account_name: "Kalipeh Platform",
  enabled: false,
};

export function ApiIntegrationSettings() {
  const client = useQueryClient();
  const wave = useQuery({
    queryKey: ["wave-settings"],
    queryFn: settingsApi.wave,
  });
  const ach = useQuery({
    queryKey: ["ach-settings"],
    queryFn: settingsApi.ach,
  });
  const waveForm = useForm<WaveSettings>({
    resolver: zodResolver(waveSchema),
    values: wave.data || waveDefaults,
  });
  const achForm = useForm<AchSettings>({
    resolver: zodResolver(achSchema),
    values: ach.data || achDefaults,
  });

  const saveWave = useMutation({
    mutationFn: settingsApi.saveWave,
    onSuccess: async (value) => {
      waveForm.reset(value);
      await client.invalidateQueries({ queryKey: ["wave-settings"] });
    },
  });
  const saveAch = useMutation({
    mutationFn: settingsApi.saveAch,
    onSuccess: async (value) => {
      achForm.reset(value);
      await client.invalidateQueries({ queryKey: ["ach-settings"] });
    },
  });
  const testWave = useMutation({ mutationFn: settingsApi.testWave });
  const testAch = useMutation({ mutationFn: settingsApi.testAch });

  if (wave.isLoading || ach.isLoading) return <ResourceState loading />;
  if (wave.error || ach.error) {
    return (
      <ResourceState
        error={wave.error || ach.error}
        loading={false}
      />
    );
  }

  return (
    <Stack spacing={3}>
      <Alert severity="info">
        Integration secrets are stored by the backend and returned to this
        browser only as masked values. Save before testing a connection.
      </Alert>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5">Wave payout API</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Configure Wave recipient verification and payout requests.
          </Typography>
          <Box
            component="form"
            onSubmit={waveForm.handleSubmit((value) => saveWave.mutate(value))}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Controller
                  name="api_base_url"
                  control={waveForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="API base URL"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="api_key"
                  control={waveForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="password"
                      label="API key"
                      error={Boolean(fieldState.error)}
                      helperText={
                        fieldState.error?.message ||
                        (wave.data?.api_key_configured
                          ? "A stored key is configured; enter a value only to replace it."
                          : "Enter the Wave business API key.")
                      }
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="business_country"
                  control={waveForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Business country"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="business_currency"
                  control={waveForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Business currency"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="aggregated_merchant_id"
                  control={waveForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Aggregated merchant ID"
                    />
                  )}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 1 }}>
              <Controller
                name="verify_recipient"
                control={waveForm.control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.checked)
                        }
                      />
                    }
                    label="Verify recipient before payout"
                  />
                )}
              />
              <Controller
                name="enabled"
                control={waveForm.control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.checked)
                        }
                      />
                    }
                    label="Enable Wave payouts"
                  />
                )}
              />
            </Box>
            {saveWave.error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {normalizeApiError(saveWave.error).message}
              </Alert>
            ) : null}
            {saveWave.isSuccess ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Wave configuration saved.
              </Alert>
            ) : null}
            <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
              <Button
                type="submit"
                variant="contained"
                disabled={saveWave.isPending}
              >
                Save Wave settings
              </Button>
              <Button
                type="button"
                disabled={testWave.isPending}
                onClick={() => testWave.mutate()}
              >
                Test Wave connection
              </Button>
            </Stack>
            {testWave.data ? (
              <Alert severity="success" sx={{ mt: 2 }}>
                {testWave.data.message}
              </Alert>
            ) : null}
            {testWave.error ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                {normalizeApiError(testWave.error).message}
              </Alert>
            ) : null}
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5">ACH banking API</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Configure the ACH provider and the platform settlement account.
          </Typography>
          <Box
            component="form"
            onSubmit={achForm.handleSubmit((value) => saveAch.mutate(value))}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Controller
                  name="api_base_url"
                  control={achForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="API base URL"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="api_key"
                  control={achForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="password"
                      label="API key"
                      error={Boolean(fieldState.error)}
                      helperText={
                        fieldState.error?.message ||
                        "Masked values preserve the stored key."
                      }
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="platform_account_name"
                  control={achForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Platform account name"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="platform_account_number"
                  control={achForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Platform account number"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="platform_routing_number"
                  control={achForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Routing number"
                      inputProps={{ inputMode: "numeric", maxLength: 9 }}
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="platform_account_type"
                  control={achForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Account type"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    >
                      <MenuItem value="CHECKING">Checking</MenuItem>
                      <MenuItem value="SAVINGS">Savings</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>
            <Controller
              name="enabled"
              control={achForm.control}
              render={({ field }) => (
                <FormControlLabel
                  sx={{ mt: 1 }}
                  control={
                    <Checkbox
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  }
                  label="Enable ACH transfers"
                />
              )}
            />
            {saveAch.error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {normalizeApiError(saveAch.error).message}
              </Alert>
            ) : null}
            {saveAch.isSuccess ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                ACH configuration saved.
              </Alert>
            ) : null}
            <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
              <Button
                type="submit"
                variant="contained"
                disabled={saveAch.isPending}
              >
                Save ACH settings
              </Button>
              <Button
                type="button"
                disabled={testAch.isPending}
                onClick={() => testAch.mutate()}
              >
                Test ACH connection
              </Button>
            </Stack>
            {testAch.data ? (
              <Alert severity="success" sx={{ mt: 2 }}>
                {testAch.data.message}
              </Alert>
            ) : null}
            {testAch.error ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                {normalizeApiError(testAch.error).message}
              </Alert>
            ) : null}
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
