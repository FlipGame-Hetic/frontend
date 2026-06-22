import { GAMEPLAY_FALLBACK } from "@frontend/types"
import type { CharacterGameplay, CharacterType } from "@frontend/types"
import { resolveApiUrl, wsWarn } from "@frontend/ws"

export type CharactersBySlug = Record<CharacterType, CharacterGameplay>

export const fetchCharacters = async (): Promise<CharactersBySlug> => {
  const bySlug: CharactersBySlug = { ...GAMEPLAY_FALLBACK }

  try {
    const response = await fetch(`${resolveApiUrl()}/characters`)
    if (!response.ok) throw new Error(`GET /characters → ${String(response.status)}`)

    const roster = (await response.json()) as CharacterGameplay[]
    for (const entry of roster) {
      if (entry.id in bySlug) {
        bySlug[entry.id] = entry
      }
    }
  } catch (error) {
    wsWarn("characters", "GET /characters failed — using local gameplay fallback", error)
  }

  return bySlug
}
