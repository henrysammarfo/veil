import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Standalone test config — doesn't go through the lovable tanstack vite plugin
// (which would try to spin up the full SSR/router pipeline). Tests render
// components directly with RTL.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
