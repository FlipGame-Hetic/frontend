import { CHARACTER_OPTIONS, DEFAULT_CHARACTER } from "@frontend/types"
import type { CharacterType } from "@frontend/types"

const FALLBACK_CHARACTER_MATERIAL = CHARACTER_OPTIONS[0].material

export const getBallColorForCharacter = (character?: CharacterType): string => {
  const id = character ?? DEFAULT_CHARACTER
  return CHARACTER_OPTIONS.find((c) => c.id === id)?.material ?? FALLBACK_CHARACTER_MATERIAL
}
