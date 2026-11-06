import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@dragon-age/domain": path.resolve(rootDir, "../packages/domain/src/index.ts"),
      "@dragon-age/client": path.resolve(rootDir, "../packages/client/src/index.ts"),
      "@extension": path.resolve(rootDir, "../dragon-age-helper/src"),
    },
  },
  server: {
    port: 5174,
  },
});
