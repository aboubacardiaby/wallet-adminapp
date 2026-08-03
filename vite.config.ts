import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    strictPort: true,
    proxy: {
      "/api/v1": {
        target: "https://kalipeh-wallet-525776555218.us-central1.run.app",
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: "localhost",
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
    css: true,
    coverage: { provider: "v8", reporter: ["text", "html"] },
  },
});
