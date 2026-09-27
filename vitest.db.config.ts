import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { include: ["db/**/*.test.ts"], environment: "node", fileParallelism: false, testTimeout: 30_000 },
  resolve: { alias: { "@": new URL(".", import.meta.url).pathname, "server-only": new URL("./test/server-only-rong.ts", import.meta.url).pathname } },
});
