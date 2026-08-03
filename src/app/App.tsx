import { AppErrorBoundary } from "../components/feedback/AppErrorBoundary";
import { ConfigurationError } from "../components/feedback/ConfigurationError";
import { env } from "../config/env";
import { AppRouter } from "./router";

export function App() {
  if (!env) return <ConfigurationError />;
  return <AppErrorBoundary><AppRouter /></AppErrorBoundary>;
}
