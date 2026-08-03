import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { Alert, Avatar, Box, Button, Card, CardContent, Container, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../../auth/AuthProvider";
import { normalizeApiError } from "../../api/errors";
import { env } from "../../config/env";

const loginSchema = z.object({ username: z.string().min(1, "Enter your username"), password: z.string().min(1, "Enter your password") });
type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const { control, handleSubmit, formState } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });
  const from = (location.state as { from?: string } | null)?.from || "/dashboard";

  if (auth.isAuthenticated) return <Navigate to={from} replace />;

  const submit = async ({ username, password }: LoginValues) => {
    setError("");
    try {
      await auth.login({ username: username.trim(), password });
      await navigate(from, { replace: true });
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      setError(`${normalized.message}${normalized.traceId ? ` Reference: ${normalized.traceId}` : ""}`);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#102a26 0 42%,#f4f5f2 42%)" }}>
      <Container maxWidth="sm">
        <Card>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Avatar sx={{ bgcolor: "primary.main", mb: 2 }}><Lock size={20} /></Avatar>
            <Typography component="h1" variant="h1">{env?.appName}</Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
              {env?.enableApiMocks ? "Enter any mock credentials to sign in. Use superadmin / superadmin for full access." : "Sign in with your administrator credentials."}
            </Typography>
            <Box component="form" onSubmit={handleSubmit(submit)} noValidate>
              <Box sx={{ display: "grid", gap: 2 }}>
                <Controller name="username" control={control} render={({ field, fieldState }) => (
                  <TextField {...field} label="Administrator username" autoComplete="username" error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
                )} />
                <Controller name="password" control={control} render={({ field, fieldState }) => (
                  <TextField {...field} type="password" label="Password" autoComplete="current-password" error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
                )} />
              </Box>
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
              <Button fullWidth size="large" variant="contained" type="submit" disabled={formState.isSubmitting} sx={{ mt: 3 }}>
                {formState.isSubmitting ? "Signing in…" : "Continue securely"}
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 2 }}>Production authentication is designed for OIDC Authorization Code with PKCE or a secure BFF session.</Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
