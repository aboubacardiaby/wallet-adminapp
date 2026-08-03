import { Ban } from "lucide-react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export function UnauthorizedPage() {
  const navigate = useNavigate();
  return <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><Box sx={{ textAlign: "center", px: 2 }}><Ban color="#d32f2f" size={60} /><Typography component="h1" variant="h1">Access not authorized</Typography><Typography color="text.secondary" sx={{ my: 2 }}>Your role or geographic scope does not permit this page.</Typography><Button variant="contained" onClick={() => navigate("/dashboard")}>Return to dashboard</Button></Box></Box>;
}
