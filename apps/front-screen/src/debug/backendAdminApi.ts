import { resolveApiUrl } from "@frontend/ws"
import type { BackendConfigPatch, BackendGameConfig } from "./backendConfigTypes"

const ADMIN_CONFIG_PATH = "/api/v1/admin/config"

export class BackendAdminApiError extends Error {
  readonly status: number | undefined

  constructor(message: string, status?: number, options?: ErrorOptions) {
    super(message, options)
    this.name = "BackendAdminApiError"
    this.status = status
  }
}

const buildAdminConfigUrl = (): string => `${resolveApiUrl()}${ADMIN_CONFIG_PATH}`

const buildHeaders = (token: string, hasBody: boolean): HeadersInit => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token.trim()}`,
  }

  if (hasBody) {
    headers["Content-Type"] = "application/json"
  }

  return headers
}

const readErrorBody = async (response: Response): Promise<string> => {
  try {
    return await response.text()
  } catch {
    return ""
  }
}

const assertOk = async (response: Response, method: string): Promise<void> => {
  if (response.ok) return

  const body = await readErrorBody(response)
  const suffix = body ? `: ${body}` : ""

  throw new BackendAdminApiError(
    `${method} ${ADMIN_CONFIG_PATH} -> ${String(response.status)}${suffix}`,
    response.status,
  )
}

const requestAdminConfig = async (init: RequestInit): Promise<Response> => {
  const method = init.method ?? "GET"

  try {
    return await fetch(buildAdminConfigUrl(), init)
  } catch (error) {
    throw new BackendAdminApiError(`${method} ${ADMIN_CONFIG_PATH} failed`, undefined, {
      cause: error,
    })
  }
}

export const fetchBackendConfig = async (token: string): Promise<BackendGameConfig> => {
  const response = await requestAdminConfig({
    method: "GET",
    headers: buildHeaders(token, false),
  })

  await assertOk(response, "GET")

  return (await response.json()) as BackendGameConfig
}

export const patchBackendConfig = async (
  token: string,
  patch: BackendConfigPatch,
): Promise<BackendGameConfig> => {
  const response = await requestAdminConfig({
    method: "PATCH",
    headers: buildHeaders(token, true),
    body: JSON.stringify(patch),
  })

  await assertOk(response, "PATCH")

  return (await response.json()) as BackendGameConfig
}
