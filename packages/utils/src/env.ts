type RuntimeEnvRecord = Record<string, string | undefined>

// globalThis.__ENV__ is injected at runtime by the deployment dashboard, which does not read the env vars bundled at build time
const readRuntimeRecord = (): RuntimeEnvRecord =>
  (globalThis as unknown as { __ENV__?: RuntimeEnvRecord }).__ENV__ ?? {}

// import.meta.env is baked in at build time by Vite, the fallback for local dev and any build that does read bundled vars
const readBuildRecord = (): RuntimeEnvRecord =>
  (import.meta as unknown as { env?: RuntimeEnvRecord }).env ?? {}

// Runtime values win over build values so that the dashboard deploy can override what was bundled
export const readRuntimeEnv = (key: string): string | undefined =>
  readRuntimeRecord()[key] ?? readBuildRecord()[key]

export const readScreenToken = (): string => readRuntimeEnv("VITE_SCREEN_TOKEN") ?? ""

export interface RuntimeEnvironmentFlags {
  environment: string
  isLocal: boolean
  isProduction: boolean
  isProductionBrowser: boolean
  isProductionCabinet: boolean
}

const readEnvironment = (): string => readRuntimeEnv("VITE_ENVIRONMENT")?.trim() ?? "local"

// Exposes several booleans for conditional rendering
export const getRuntimeEnvironmentFlags = (
  environment = readEnvironment(),
): RuntimeEnvironmentFlags => {
  const normalized = environment.trim() || "local"

  return {
    environment: normalized,
    isLocal: normalized.includes("local") || normalized.includes("development"),
    isProduction: normalized.includes("production"),
    isProductionBrowser: normalized === "production-browser",
    isProductionCabinet: normalized === "production-cabinet" || normalized === "production",
  }
}

export const runtimeEnvironment = getRuntimeEnvironmentFlags()
