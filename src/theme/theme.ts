import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#146c5c", dark: "#0d5145", contrastText: "#ffffff" },
    secondary: { main: "#e76f51" },
    background: { default: "#f4f5f2", paper: "#ffffff" },
    text: { primary: "#17211f", secondary: "#64716e" },
    divider: "#dfe4e1",
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    h1: { fontWeight: 700, fontSize: "2rem" },
    h2: { fontWeight: 700, fontSize: "1.35rem" },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiCard: { styleOverrides: { root: { border: "1px solid #dfe4e1", boxShadow: "none" } } },
  },
});
