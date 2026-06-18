const readConfiguredApiUrl = (): string | undefined => {
  const runtimeEnv = (globalThis as unknown as Record<string, Record<string, string> | undefined>)
    .__ENV__
  const fromRuntime = runtimeEnv?.VITE_API_URL?.trim()
  if (fromRuntime) return fromRuntime

  const fromBuild = import.meta.env.VITE_API_URL?.trim()
  if (fromBuild) return fromBuild

  return undefined
}

const deriveFromLocation = (): string => {
  const location = (globalThis as { location?: Location }).location
  const protocol = location?.protocol === "https:" ? "https:" : "http:"
  const rawHostname = location?.hostname.trim()
  const hostname = rawHostname && rawHostname.length > 0 ? rawHostname : "localhost"

  return `${protocol}//${hostname}`
}

const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, "")

export const API_BASE_URL = stripTrailingSlash(readConfiguredApiUrl() ?? deriveFromLocation())
