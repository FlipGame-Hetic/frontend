import { CHARACTER_OPTIONS, DEFAULT_CHARACTER } from "@frontend/types"
import type { CharacterType } from "@frontend/types"

export function getBallColorForCharacter(character?: CharacterType): string {
  const id = character ?? DEFAULT_CHARACTER
  return CHARACTER_OPTIONS.find((c) => c.id === id)?.material ?? "#FF8C00"
}
