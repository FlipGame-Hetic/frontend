import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    exclude: ["**/e2e/**", "**/node_modules/**", "**/dist/**"],
    projects: [
      {
        extends: "apps/front-screen/vite.config.ts",
        test: {
          root: "apps/front-screen",
          include: ["apps/front-screen/tests/**/*.test.{ts,tsx}"],
        },
      },
      {
        extends: "apps/back-screen/vite.config.ts",
        test: {
          root: "apps/back-screen",
          include: ["apps/back-screen/tests/**/*.test.{ts,tsx}"],
        },
      },
      {
        extends: "packages/utils/vitest.config.ts",
        test: {
          root: "packages/utils",
          include: ["packages/utils/tests/**/*.test.ts"],
        },
      },
      {
        extends: "packages/ui/vitest.config.ts",
        test: {
          root: "packages/ui",
          include: ["packages/ui/tests/**/*.test.{ts,tsx}"],
        },
      },
      {
        extends: "apps/dmd-screen/vite.config.ts",
        test: {
          root: "apps/dmd-screen",
          include: ["apps/dmd-screen/tests/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
})
