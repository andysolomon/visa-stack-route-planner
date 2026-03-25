import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/lib/visa/**", "src/lib/timeline/**", "src/lib/rate-limit.ts"],
      thresholds: {
        lines: 50,
        branches: 50,
        functions: 50,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
