import { CHARACTER_OPTIONS, DEFAULT_CHARACTER } from "@frontend/types"
import type { CharacterConfig, CharacterType } from "@frontend/types"
import useGameStore from "@/stores/useGameStore"

const getCurrentCharacterSnapshot = (): CharacterType | undefined => {
  const { currentPlayer, selectedPlayers } = useGameStore.getState()
  return selectedPlayers.find((player) => player.player === currentPlayer)?.character
}

export const getCharacterConfig = (character?: CharacterType): CharacterConfig => {
  const id = character ?? DEFAULT_CHARACTER.id
  return CHARACTER_OPTIONS.find((option) => option.id === id) ?? DEFAULT_CHARACTER
}

export const getCurrentCharacterConfigSnapshot = (): CharacterConfig => {
  return getCharacterConfig(getCurrentCharacterSnapshot())
}

export const useCurrentCharacterConfig = (): CharacterConfig => {
  // Reads through Zustand's selector to ensure components re-render when the active player changes
  return useGameStore((state) => {
    const character = state.selectedPlayers.find(
      (player) => player.player === state.currentPlayer,
    )?.character
    return getCharacterConfig(character)
  })
}

export const getBallColorForCharacter = (character?: CharacterType): string => {
  return getCharacterConfig(character).material
}

export const getCurrentBallColorSnapshot = (): string => {
  return getCurrentCharacterConfigSnapshot().material
}

export const useCurrentBallColor = (): string => {
  return useCurrentCharacterConfig().material
}
