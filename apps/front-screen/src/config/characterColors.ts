import { CHARACTER_OPTIONS, DEFAULT_CHARACTER } from "@frontend/types"
import type { CharacterType } from "@frontend/types"
import useGameStore from "@/stores/useGameStore"

const getCurrentCharacterSnapshot = (): CharacterType | undefined => {
  const { currentPlayer, selectedPlayers } = useGameStore.getState()
  return selectedPlayers.find((player) => player.player === currentPlayer)?.character
}

export const getBallColorForCharacter = (character?: CharacterType): string => {
  const id = character ?? DEFAULT_CHARACTER.id
  return CHARACTER_OPTIONS.find((c) => c.id === id)?.material ?? DEFAULT_CHARACTER.material
}

export const getCurrentBallColorSnapshot = (): string => {
  return getBallColorForCharacter(getCurrentCharacterSnapshot())
}

export const useCurrentBallColor = (): string => {
  // Reads through Zustand's selector to ensure components re-render when the active player changes.
  return useGameStore((state) => {
    const character = state.selectedPlayers.find(
      (player) => player.player === state.currentPlayer,
    )?.character
    return getBallColorForCharacter(character)
  })
}
