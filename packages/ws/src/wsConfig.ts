import { readRuntimeEnv } from "@frontend/utils"

const RECONNECT_BASE_MS = 1000
const RECONNECT_MAX_MS = 15000

type WsEnvKey = "VITE_WS_URL" | "VITE_SCREEN_HUB_URL" | "VITE_API_URL"

type RuntimeLocation = Pick<Location, "hostname" | "protocol">

export const nextBackoffDelay = (attempt: number): number => {
  const exponential = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** attempt)
  // Approx. 20% jitter so every screen doesn't reconnect on the same beat and stampede the server after an outage
  const jitter = exponential * 0.2 * (Math.random() * 2 - 1)

  return Math.round(exponential + jitter)
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

const GAME_WS_PATH = "/ws/bridge"

const defaultGameWsUrl = (): string => {
  return `${defaultScreenHubUrl()}${GAME_WS_PATH}`
}

const defaultApiUrl = (): string => {
  const location = readLocation()
  const protocol = location?.protocol === "https:" ? "https:" : "http:"
  const hostname = readRuntimeHostname()

  return `${protocol}//${hostname}`
}

const readUrlHostname = (value: string): string | undefined => {
  try {
    return new URL(value).hostname
  } catch {
    return undefined
  }
}

const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"])

const isLoopbackHostname = (hostname: string | undefined): boolean => {
  if (!hostname) return false

  return LOOPBACK_HOSTNAMES.has(hostname.toLowerCase())
}

// A loopback env URL (e.g. a build baked with localhost) is only trusted when the app itself runs on loopback, otherwise other devices would be pointed at their own machine instead of the host
const shouldUseConfiguredUrl = (url: string): boolean => {
  const configuredHostname = readUrlHostname(url)

  if (!isLoopbackHostname(configuredHostname)) return true

  return isLoopbackHostname(readRuntimeHostname())
}

const resolveUrl = (key: WsEnvKey, fallback: () => string, override?: string): string => {
  const overrideUrl = cleanUrl(override)

  if (overrideUrl) {
    return overrideUrl
  }

  const envUrl = cleanUrl(readRuntimeEnv(key))

  if (envUrl && shouldUseConfiguredUrl(envUrl)) {
    return envUrl
  }

  const fallbackUrl = fallback()

  if (envUrl) {
    console.warn(
      `[ws] ${key} env value "${envUrl}" ignored (loopback host on non-loopback runtime "${readRuntimeHostname()}") — falling back to default`,
      fallbackUrl,
    )
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

export const resolveApiUrl = (override?: string): string => {
  return resolveUrl("VITE_API_URL", defaultApiUrl, override)
}
