import { Construction } from "lucide-react";
import { Alert, Box, Card, CardContent, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";

export function PlaceholderPage({ title }: { title: string }) {
  const location = useLocation();
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography component="h1" variant="h1">{title}</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>The protected route, navigation, and permission boundary are ready for its delivery phase.</Typography>
      <Card sx={{ mt: 3 }}><CardContent sx={{ py: 8, textAlign: "center" }}><Construction color="#146c5c" size={48} /><Typography variant="h2" sx={{ mt: 2 }}>Planned beyond Phase 1</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Route: {location.pathname}</Typography></CardContent></Card>
      <Alert severity="warning" sx={{ mt: 2 }}>No regulatory, compliance, or financial decision is made by this placeholder.</Alert>
    </Box>
  );
}
