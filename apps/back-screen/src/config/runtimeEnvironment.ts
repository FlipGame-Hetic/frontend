export interface RuntimeEnvironmentFlags {
  environment: string
  isLocal: boolean
  isProduction: boolean
  isProductionBrowser: boolean
  isProductionCabinet: boolean
}

const readEnvironment = (): string => {
  const runtimeEnv = (globalThis as unknown as Record<string, Record<string, string> | undefined>)
    .__ENV__
  const buildEnv = import.meta.env.VITE_ENVIRONMENT as string | undefined
  return runtimeEnv?.VITE_ENVIRONMENT?.trim() ?? buildEnv?.trim() ?? "local"
}

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
