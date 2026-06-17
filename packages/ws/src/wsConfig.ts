import { wsLog, wsWarn } from "./wsLog"

export const RECONNECT_DELAY_MS = 3000

const GAME_WS_PATH = "/ws/bridge"
const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"])

type WsEnvKey = "VITE_WS_URL" | "VITE_SCREEN_HUB_URL"
type WsEnv = Partial<Record<WsEnvKey, string>>

type RuntimeLocation = Pick<Location, "hostname" | "protocol">

const readEnv = (): WsEnv => {
  const buildEnv = (import.meta as unknown as { env?: WsEnv }).env ?? {}
  const runtimeEnv = ((globalThis as Record<string, unknown>).__ENV__ as WsEnv | undefined) ?? {}
  return { ...buildEnv, ...runtimeEnv }
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

  return `${protocol}//${hostname}`
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

  if (overrideUrl) {
    wsLog("config", `resolved ${key} from OVERRIDE`, overrideUrl)
    return overrideUrl
  }

  const env = readEnv()
  const envUrl = cleanUrl(env[key])

  if (envUrl && shouldUseConfiguredUrl(envUrl)) {
    wsLog("config", `resolved ${key} from ENV`, envUrl)
    return envUrl
  }

  const fallbackUrl = fallback()

  if (envUrl) {
    wsWarn(
      "config",
      `${key} env value "${envUrl}" ignored (loopback host on non-loopback runtime "${readRuntimeHostname()}") — falling back to default`,
      fallbackUrl,
    )
  } else {
    wsLog("config", `resolved ${key} from DEFAULT (no env set)`, fallbackUrl)
  }

  return fallbackUrl
}

export const DEFAULT_SCREEN_HUB_URL = defaultScreenHubUrl()

export const resolveGameWsUrl = (override?: string): string => {
  return resolveUrl("VITE_WS_URL", defaultGameWsUrl, override)
}

export const resolveScreenHubUrl = (override?: string): string => {
  return resolveUrl("VITE_SCREEN_HUB_URL", defaultScreenHubUrl, override)
}
