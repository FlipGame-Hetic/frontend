type RuntimeEnvRecord = Record<string, string | undefined>

const readRuntimeRecord = (): RuntimeEnvRecord =>
  (globalThis as unknown as { __ENV__?: RuntimeEnvRecord }).__ENV__ ?? {}

const readBuildRecord = (): RuntimeEnvRecord =>
  (import.meta as unknown as { env?: RuntimeEnvRecord }).env ?? {}

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
