import { button, folder, useControls } from "leva"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { fetchBackendConfig, patchBackendConfig, BackendAdminApiError } from "./backendAdminApi"
import {
  clearStoredBackendAdminToken,
  readStoredBackendAdminToken,
  writeStoredBackendAdminToken,
} from "./backendAdminTokenStorage"
import {
  BACKEND_CONFIG_CATEGORIES,
  BACKEND_CONFIG_FIELDS,
  type BackendConfigField,
} from "./backendConfigCatalog"
import {
  shouldPatchBackendConfigChange,
  toBackendConfigPatch,
  type BackendConfigLevaChangeContext,
} from "./backendConfigLeva"
import {
  BACKEND_CONFIG_PATCH_DEBOUNCE_MS,
  BackendConfigPatchQueue,
} from "./backendConfigPatchQueue"
import type { BackendGameConfig } from "./backendConfigTypes"
import { runtimeEnvironment } from "@frontend/utils"

const ADMIN_TOKEN_COMMAND = runtimeEnvironment.isProductionCabinet
  ? "docker exec flip-spammer-api-1 app generate-admin-token"
  : "docker exec backend-api-1 app generate-admin-token"
const INITIAL_STATUS = "Paste token, then load config"

type SetLevaValues = (values: Record<string, unknown>) => void

type BackendConfigChangeHandler = (
  field: BackendConfigField,
  value: number,
  context: BackendConfigLevaChangeContext,
) => void

type LevaSchema = Parameters<typeof folder>[0]

const formatBackendAdminError = (error: unknown): string => {
  if (error instanceof BackendAdminApiError) {
    if (error.status === 401) return "Admin token rejected (401)"
    if (error.status !== undefined) return `Backend admin error ${String(error.status)}`

    return error.message
  }

  if (error instanceof Error) return error.message

  return "Backend admin request failed"
}

const copyAdminTokenCommand = async (): Promise<void> => {
  await navigator.clipboard.writeText(ADMIN_TOKEN_COMMAND)
}

const createBackendConfigSchema = (
  config: BackendGameConfig,
  onChange: BackendConfigChangeHandler,
) => {
  const schema: LevaSchema = {}

  for (const category of BACKEND_CONFIG_CATEGORIES) {
    const controls: LevaSchema = {}

    for (const field of BACKEND_CONFIG_FIELDS) {
      if (field.category !== category.label) continue

      controls[field.key] = {
        value: config[field.key],
        label: field.label,
        min: field.min,
        max: field.max,
        step: field.step,
        onChange: (value: number, _path: string, context: BackendConfigLevaChangeContext) => {
          onChange(field, value, context)
        },
      }
    }

    schema[category.label] = folder(controls, { collapsed: category.collapsed })
  }

  return schema
}

interface BackendConfigControlsProps {
  getAdminToken: () => string
  initialConfig: BackendGameConfig
  reportStatus: (status: string) => void
  syncConfig: (config: BackendGameConfig) => void
}

const BackendConfigControls = ({
  getAdminToken,
  initialConfig,
  reportStatus,
  syncConfig,
}: BackendConfigControlsProps) => {
  const patchQueue = useMemo(
    () =>
      new BackendConfigPatchQueue(
        async (patch) => {
          const token = getAdminToken()
          if (!token) throw new Error("Missing admin token")

          const savedConfig = await patchBackendConfig(token, patch)
          syncConfig(savedConfig)
          reportStatus(`Saved ${Object.keys(patch).join(", ")}`)
        },
        BACKEND_CONFIG_PATCH_DEBOUNCE_MS,
        (error) => {
          syncConfig(initialConfig)
          reportStatus(formatBackendAdminError(error))
        },
      ),
    [getAdminToken, initialConfig, reportStatus, syncConfig],
  )

  useEffect(() => {
    return () => {
      patchQueue.cancel()
    }
  }, [patchQueue])

  const handleFieldChange = useCallback<BackendConfigChangeHandler>(
    (field, value, context) => {
      if (!shouldPatchBackendConfigChange(context)) return
      if (!Number.isFinite(value)) {
        reportStatus(`Ignored invalid ${field.label}`)
        return
      }

      patchQueue.enqueue(toBackendConfigPatch(field, value))
    },
    [patchQueue, reportStatus],
  )

  const schema = useMemo(
    () => createBackendConfigSchema(initialConfig, handleFieldChange),
    [handleFieldChange, initialConfig],
  )

  useControls("Backend config", () => schema, { order: 5 })

  return null
}

const BackendAdminControls = () => {
  const [initialToken] = useState(readStoredBackendAdminToken)
  const tokenRef = useRef(initialToken)
  const statusRef = useRef(INITIAL_STATUS)
  const setAdminControlsRef = useRef<SetLevaValues | null>(null)
  const [config, setConfig] = useState<BackendGameConfig | null>(null)
  const [configVersion, setConfigVersion] = useState(0)

  const reportStatus = useCallback((status: string) => {
    statusRef.current = status
    setAdminControlsRef.current?.({ backendStatus: status })
  }, [])

  const syncConfig = useCallback((nextConfig: BackendGameConfig) => {
    setConfig(nextConfig)
    setConfigVersion((version) => version + 1)
  }, [])

  const getAdminToken = useCallback(() => tokenRef.current.trim(), [])

  const loadConfig = useCallback(async () => {
    const token = getAdminToken()

    if (!token) {
      reportStatus("Missing admin token")
      return
    }

    writeStoredBackendAdminToken(token)
    reportStatus("Loading backend config...")

    try {
      const nextConfig = await fetchBackendConfig(token)
      syncConfig(nextConfig)
      reportStatus("Backend config loaded")
    } catch (error) {
      setConfig(null)
      reportStatus(formatBackendAdminError(error))
    }
  }, [getAdminToken, reportStatus, syncConfig])

  const forgetToken = useCallback(() => {
    tokenRef.current = ""
    clearStoredBackendAdminToken()
    setConfig(null)
    setAdminControlsRef.current?.({ adminToken: "" })
    reportStatus("Token forgotten")
  }, [reportStatus])

  const handleCopyTokenCommand = useCallback(() => {
    void copyAdminTokenCommand()
      .then(() => {
        reportStatus("Token command copied")
      })
      .catch(() => {
        reportStatus("Clipboard unavailable; command visible")
      })
  }, [reportStatus])

  const [, setAdminControls] = useControls(
    "Backend admin",
    () => ({
      adminToken: {
        value: initialToken,
        label: "Admin token",
        transient: false,
        onChange: (value: string, _path: string, context: BackendConfigLevaChangeContext) => {
          tokenRef.current = value

          if (shouldPatchBackendConfigChange(context)) {
            writeStoredBackendAdminToken(value)
          }
        },
      },
      backendStatus: {
        value: INITIAL_STATUS,
        label: "Status",
        disabled: true,
      },
      tokenCommand: {
        value: ADMIN_TOKEN_COMMAND,
        label: "Token command",
        disabled: true,
      },
      "Load config": button(() => {
        void loadConfig()
      }),
      "Forget token": button(forgetToken),
      "Copy token command": button(handleCopyTokenCommand),
    }),
    { order: 4 },
  )

  useEffect(() => {
    setAdminControlsRef.current = setAdminControls as SetLevaValues
    setAdminControlsRef.current({ backendStatus: statusRef.current })

    return () => {
      setAdminControlsRef.current = null
    }
  }, [setAdminControls])

  return (
    <>
      {config ? (
        <BackendConfigControls
          key={configVersion}
          initialConfig={config}
          getAdminToken={getAdminToken}
          reportStatus={reportStatus}
          syncConfig={syncConfig}
        />
      ) : null}
    </>
  )
}

export default BackendAdminControls
