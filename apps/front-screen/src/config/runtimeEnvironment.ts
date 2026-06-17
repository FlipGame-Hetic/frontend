export interface RuntimeEnvironmentFlags {
  environment: string
  isProduction: boolean
  isProductionBrowser: boolean
  isProductionCabinet: boolean
}

const readEnvironment = (): string => {
  return import.meta.env.VITE_ENVIRONMENT?.trim() ?? "local"
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
