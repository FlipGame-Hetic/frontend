const BACKEND_ADMIN_TOKEN_STORAGE_KEY = "flipper.frontScreen.backendAdminToken"

const readSessionStorage = (): Storage | undefined => {
  try {
    return globalThis.sessionStorage
  } catch {
    return undefined
  }
}

export const readStoredBackendAdminToken = (): string => {
  return readSessionStorage()?.getItem(BACKEND_ADMIN_TOKEN_STORAGE_KEY) ?? ""
}

export const writeStoredBackendAdminToken = (token: string): void => {
  const trimmed = token.trim()
  const storage = readSessionStorage()

  if (!storage) return

  if (trimmed) {
    storage.setItem(BACKEND_ADMIN_TOKEN_STORAGE_KEY, trimmed)
  } else {
    storage.removeItem(BACKEND_ADMIN_TOKEN_STORAGE_KEY)
  }
}

export const clearStoredBackendAdminToken = (): void => {
  readSessionStorage()?.removeItem(BACKEND_ADMIN_TOKEN_STORAGE_KEY)
}
