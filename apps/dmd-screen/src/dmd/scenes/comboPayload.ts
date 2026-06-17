import type { ComboDirection } from "@frontend/types"

const isComboDirection = (value: unknown): value is ComboDirection => value === "L" || value === "R"

export const parseComboSequence = (value: unknown): ComboDirection[] | undefined => {
  if (!Array.isArray(value) || value.length === 0) return undefined
  return value.every(isComboDirection) ? value : undefined
}
