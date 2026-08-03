import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthProvider } from "../auth/AuthProvider";
import { theme } from "../theme/theme";
import { AppRouter } from "./router";

function renderApp(path = "/dashboard") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<ThemeProvider theme={theme}><QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><AuthProvider><AppRouter /></AuthProvider></MemoryRouter></QueryClientProvider></ThemeProvider>);
}

describe("route security", () => {
  it("redirects an anonymous user to login", async () => {
    renderApp("/audit");
    expect(await screen.findByRole("heading", { name: /remittance agent administration portal/i })).toBeInTheDocument();
  });

  it("returns to the requested page after login", async () => {
    renderApp("/audit");
    await screen.findByRole("heading", { name: /remittance agent administration portal/i });
    await userEvent.click(screen.getByRole("button", { name: /continue securely/i }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Audit log" })).toBeInTheDocument());
  });
});
