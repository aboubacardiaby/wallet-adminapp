import { Component, type ErrorInfo, type ReactNode } from "react";
import { Alert, Box, Button, Typography } from "@mui/material";

interface State { failed: boolean }

export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application render failed", { name: error.name, componentStack: info.componentStack });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Box sx={{ maxWidth: 640, mx: "auto", mt: 10, px: 3 }}>
        <Alert severity="error">
          <Typography variant="h6">The portal could not display this page.</Typography>
          <Typography variant="body2" sx={{ my: 1 }}>No sensitive details were exposed. Reload and try again.</Typography>
          <Button onClick={() => window.location.reload()}>Reload application</Button>
        </Alert>
      </Box>
    );
  }
}
