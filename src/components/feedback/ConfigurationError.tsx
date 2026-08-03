import { Alert, Container, Typography } from "@mui/material";
import { envError } from "../../config/env";

export function ConfigurationError() {
  return (
    <Container maxWidth="sm" sx={{ pt: 10 }}>
      <Alert severity="error">
        <Typography variant="h6">Application configuration is invalid</Typography>
        <Typography variant="body2">
          Ask an administrator to verify the public environment settings before using this portal.
        </Typography>
        {import.meta.env.DEV && <pre>{JSON.stringify(envError, null, 2)}</pre>}
      </Alert>
    </Container>
  );
}
