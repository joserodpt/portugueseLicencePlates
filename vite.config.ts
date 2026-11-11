import { defineConfig } from "vitest/config";

// Served from https://<user>.github.io/portugueseLicencePlates/ on GitHub Pages.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? "/portugueseLicencePlates/" : "/",
  test: {
    include: ["src/**/*.test.ts"],
  },
});
