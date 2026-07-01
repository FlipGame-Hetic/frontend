import type { BackendConfigField } from "./backendConfigCatalog"
import type { BackendConfigPatch } from "./backendConfigTypes"

export interface BackendConfigLevaChangeContext {
  initial?: boolean
  fromPanel?: boolean
}

export const shouldPatchBackendConfigChange = (
  context: BackendConfigLevaChangeContext,
): boolean => {
  return !context.initial && context.fromPanel === true
}

export const toBackendConfigPatch = (
  field: BackendConfigField,
  value: number,
): BackendConfigPatch => {
  const normalized = field.kind === "integer" ? Math.trunc(value) : value

  return { [field.key]: normalized }
}
