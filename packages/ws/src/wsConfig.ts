export const RECONNECT_DELAY_MS = 3000

const DEFAULT_WS_PORT = "8080"
const GAME_WS_PATH = "/ws/bridge"
const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"])

type WsEnvKey = "VITE_WS_URL" | "VITE_SCREEN_HUB_URL"
type WsEnv = Partial<Record<WsEnvKey, string>>

type RuntimeLocation = Pick<Location, "hostname" | "protocol">

const readEnv = (): WsEnv => {
  return (import.meta as unknown as { env?: WsEnv }).env ?? {}
}

const readLocation = (): RuntimeLocation | undefined => {
  return (globalThis as typeof globalThis & { location?: RuntimeLocation }).location
}

const cleanUrl = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim()

  if (!trimmed) return undefined

  return trimmed
}

const readRuntimeHostname = (): string => {
  const hostname = readLocation()?.hostname.trim()

  if (!hostname) return "localhost"

  return hostname
}

const defaultScreenHubUrl = (): string => {
  const location = readLocation()
  const protocol = location?.protocol === "https:" ? "wss:" : "ws:"
  const hostname = readRuntimeHostname()
  const port = isLoopbackHostname(hostname) ? `:${DEFAULT_WS_PORT}` : ""

  return `${protocol}//${hostname}${port}`
}

const defaultGameWsUrl = (): string => {
  return `${defaultScreenHubUrl()}${GAME_WS_PATH}`
}

const readUrlHostname = (value: string): string | undefined => {
  try {
    return new URL(value).hostname
  } catch {
    return undefined
  }
}

const isLoopbackHostname = (hostname: string | undefined): boolean => {
  if (!hostname) return false

  return LOOPBACK_HOSTNAMES.has(hostname.toLowerCase())
}

const shouldUseConfiguredUrl = (url: string): boolean => {
  const configuredHostname = readUrlHostname(url)

  if (!isLoopbackHostname(configuredHostname)) return true

  return isLoopbackHostname(readRuntimeHostname())
}

const resolveUrl = (key: WsEnvKey, fallback: () => string, override?: string): string => {
  const overrideUrl = cleanUrl(override)

  if (overrideUrl) return overrideUrl

  const env = readEnv()
  const envUrl = cleanUrl(env[key])

  if (envUrl && shouldUseConfiguredUrl(envUrl)) return envUrl

  return fallback()
}

export const DEFAULT_SCREEN_HUB_URL = defaultScreenHubUrl()

export const resolveGameWsUrl = (override?: string): string => {
  return resolveUrl("VITE_WS_URL", defaultGameWsUrl, override)
}

export const resolveScreenHubUrl = (override?: string): string => {
  return resolveUrl("VITE_SCREEN_HUB_URL", defaultScreenHubUrl, override)
}
