import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Unit tests only (lib/ and content/ logic). Pages are checked by `npm run
// verify` against a real build, not here.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
