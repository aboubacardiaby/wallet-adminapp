import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { Alert, Avatar, Box, Button, Card, CardContent, Container, MenuItem, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../../auth/AuthProvider";
import { normalizeApiError } from "../../api/errors";
import { env } from "../../config/env";

const loginSchema = z.object({ role: z.string(), username:z.string(), password:z.string() });
type LoginValues = z.infer<typeof loginSchema>;

const users = [
  ["SUPER_ADMINISTRATOR", "Samira — Super Administrator"],
  ["COUNTRY_MANAGER", "Moussa — Country Manager"],
  ["COMPLIANCE_OFFICER", "Awa — Compliance Officer"],
  ["FINANCE_OFFICER", "Ibrahim — Finance Officer"],
  ["AUDITOR", "Fatou — Auditor"],
] as const;

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const { control, handleSubmit, formState } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema), defaultValues: { role: "SUPER_ADMINISTRATOR",username:"",password:"" },
  });
  const from = (location.state as { from?: string } | null)?.from || "/dashboard";

  if (auth.isAuthenticated) return <Navigate to={from} replace />;

  const submit = async ({ role,username,password }: LoginValues) => {
    setError("");
    if(!env?.enableApiMocks&&(!username.trim()||!password)){setError("Enter your administrator username and password.");return}
    try { await auth.login(env?.enableApiMocks?role:{username:username.trim(),password}); await navigate(from, { replace: true }); }
    catch (reason) {
      const normalized = normalizeApiError(reason);
      setError(`${normalized.message}${normalized.traceId ? ` Reference: ${normalized.traceId}` : ""}`);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#102a26 0 42%,#f4f5f2 42%)" }}>
      <Container maxWidth="sm">
        <Card><CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Avatar sx={{ bgcolor: "primary.main", mb: 2 }}><Lock size={20} /></Avatar>
          <Typography component="h1" variant="h1">{env?.appName}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>{env?.enableApiMocks ? "Sign in through the configured identity provider. This environment uses scoped mock identities for development." : "Sign in with your administrator credentials."}</Typography>
          <Box component="form" onSubmit={handleSubmit(submit)} noValidate>
            {env?.enableApiMocks?<Controller name="role" control={control} render={({ field, fieldState }) => (
              <TextField {...field} select fullWidth label="Mock identity" error={Boolean(fieldState.error)} helperText={fieldState.error?.message}>
                {users.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
              </TextField>
            )} />:<Box sx={{display:"grid",gap:2}}><Controller name="username" control={control} render={({field})=><TextField {...field} label="Administrator username" autoComplete="username"/>}/><Controller name="password" control={control} render={({field})=><TextField {...field} type="password" label="Password" autoComplete="current-password"/>}/></Box>}
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            <Button fullWidth size="large" variant="contained" type="submit" disabled={formState.isSubmitting} sx={{ mt: 3 }}>
              {formState.isSubmitting ? "Signing in…" : "Continue securely"}
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 2 }}>Production authentication is designed for OIDC Authorization Code with PKCE or a secure BFF session.</Typography>
        </CardContent></Card>
      </Container>
    </Box>
  );
}
