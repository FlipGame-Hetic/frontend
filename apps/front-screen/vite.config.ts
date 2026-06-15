import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { resolve } from "node:path"
import { loadEnv } from "vite"

const requireBuildEnv = (mode: string): void => {
  const env = loadEnv(mode, __dirname, "")

  if (!env.VITE_WS_URL?.trim()) {
    throw new Error("Missing VITE_WS_URL. Configure it as a build-time env var.")
  }

  if (env.VITE_SCREEN_TOKEN?.trim() && !env.VITE_SCREEN_HUB_URL?.trim()) {
    throw new Error("Missing VITE_SCREEN_HUB_URL. Configure it when VITE_SCREEN_TOKEN is set.")
  }
}

export default defineConfig(({ command, mode }) => {
  if (command === "build" && mode === "production") {
    requireBuildEnv(mode)
  }

  return {
    base: "./",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    server: {
      port: 3000,
    },
    test: {
      globals: true,
      environment: "happy-dom",
      setupFiles: ["./tests/unit/setup.ts"],
      include: ["tests/**/*.test.{ts,tsx}"],
      css: true,
    },
  }
})
