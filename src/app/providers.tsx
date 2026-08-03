import { QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider } from "@mui/material";
import type { PropsWithChildren } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../auth/AuthProvider";
import { theme } from "../theme/theme";
import { queryClient } from "./queryClient";

export function AppProviders({ children }: PropsWithChildren) {
  return <ThemeProvider theme={theme}><CssBaseline /><QueryClientProvider client={queryClient}><BrowserRouter><AuthProvider>{children}</AuthProvider></BrowserRouter></QueryClientProvider></ThemeProvider>;
}
