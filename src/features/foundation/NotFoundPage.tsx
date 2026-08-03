import { Box, Button, Typography } from "@mui/material";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return <Box sx={{ textAlign: "center", mt: 12 }}><Typography component="h1" variant="h1">Page not found</Typography><Button component={Link} to="/dashboard" sx={{ mt: 2 }}>Go to dashboard</Button></Box>;
}
