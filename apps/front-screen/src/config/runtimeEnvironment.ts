export interface RuntimeEnvironmentFlags {
  environment: string
  isProduction: boolean
  isProductionBrowser: boolean
  isProductionCabinet: boolean
}

const readEnvironment = (): string => {
  const runtimeEnv = (globalThis as unknown as Record<string, Record<string, string> | undefined>)
    .__ENV__
  return runtimeEnv?.VITE_ENVIRONMENT?.trim() ?? import.meta.env.VITE_ENVIRONMENT?.trim() ?? "local"
}

export const getRuntimeEnvironmentFlags = (
  environment = readEnvironment(),
): RuntimeEnvironmentFlags => {
  const normalized = environment.trim() || "local"

  return {
    environment: normalized,
    isProduction: normalized.includes("production"),
    isProductionBrowser: normalized === "production-browser",
    isProductionCabinet: normalized === "production-cabinet" || normalized === "production",
  }
}

export const runtimeEnvironment = getRuntimeEnvironmentFlags()
