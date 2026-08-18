import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    // Use 'node' for pure logic tests (utils, store, API routes)
    // Use 'jsdom' for tests that need browser APIs
    environment: "node",
    globals: true,
    // Setup files can be added here if needed
    // setupFiles: ['./src/__tests__/setup.ts'],
    environmentOptions: {
      jsdom: {
        url: "http://localhost:3000",
      },
    },
    // Exclude Next.js internals and node_modules
    exclude: ["node_modules", ".next", "out"],
    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules",
        ".next",
        "src/__tests__",
        "**/*.config.*",
        "**/*.d.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
