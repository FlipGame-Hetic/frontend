export const RECONNECT_DELAY_MS = 3000
export const DEFAULT_WS_URL = "ws://localhost:8080/ws/bridge"
export const DEFAULT_SCREEN_HUB_URL = "ws://localhost:8080"

type WsEnvKey = "VITE_WS_URL" | "VITE_SCREEN_HUB_URL"
type WsEnv = Partial<Record<WsEnvKey, string>> & {
  PROD?: boolean
}

const readEnv = (): WsEnv => {
  return (import.meta as unknown as { env?: WsEnv }).env ?? {}
}

const cleanUrl = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim()
  return trimmed ?? undefined
}

const resolveUrl = (key: WsEnvKey, fallback: string, override?: string): string => {
  const env = readEnv()
  const configuredUrl = cleanUrl(override) ?? cleanUrl(env[key])

  if (configuredUrl) return configuredUrl
  if (!env.PROD) return fallback

  throw new Error(`Missing ${key}. Configure it at build time for production deploys.`)
}

export const resolveGameWsUrl = (override?: string): string => {
  return resolveUrl("VITE_WS_URL", DEFAULT_WS_URL, override)
}

export const resolveScreenHubUrl = (override?: string): string => {
  return resolveUrl("VITE_SCREEN_HUB_URL", DEFAULT_SCREEN_HUB_URL, override)
}
