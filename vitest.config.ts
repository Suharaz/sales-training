import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { include: ["core/**/*.test.ts"], environment: "node" },
  resolve: { alias: { "@": new URL(".", import.meta.url).pathname, "server-only": new URL("./test/server-only-rong.ts", import.meta.url).pathname } },
});
