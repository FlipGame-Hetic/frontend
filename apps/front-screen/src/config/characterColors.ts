import { CHARACTER_OPTIONS, DEFAULT_CHARACTER } from "@frontend/types"
import type { CharacterType } from "@frontend/types"
import useGameStore from "@/stores/useGameStore"

const getCurrentCharacter = (): CharacterType | undefined => {
  const { currentPlayer, selectedPlayers } = useGameStore.getState()
  return selectedPlayers.find((player) => player.player === currentPlayer)?.character
}

export const getBallColorForCharacter = (character?: CharacterType): string => {
  const id = character ?? getCurrentCharacter() ?? DEFAULT_CHARACTER.id
  return CHARACTER_OPTIONS.find((c) => c.id === id)?.material ?? DEFAULT_CHARACTER.material
}
