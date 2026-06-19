import { useEffect } from "react"
import { DEFAULT_CHARACTER, GAMEPLAY_FALLBACK } from "@frontend/types"
import type { CharacterType } from "@frontend/types"
import { broadcastEvent } from "@frontend/ws"
import useGameStore from "@/stores/useGameStore"
import useUltimateStore from "@/stores/useUltimateStore"

const getCurrentCharacter = (): CharacterType => {
  const { currentPlayer, selectedPlayers } = useGameStore.getState()

  return (
    selectedPlayers.find((player) => player.player === currentPlayer)?.character ??
    DEFAULT_CHARACTER.id
  )
}

const getDebugUltimateCharacter = (character: CharacterType): CharacterType => {
  if (character !== "ghost") return character

  const nextUltiId = useUltimateStore.getState().nextUltiId
  return nextUltiId && nextUltiId !== "ghost" ? nextUltiId : "oracle"
}

const triggerDebugUltimate = (): void => {
  const character = getCurrentCharacter()
  const gameplay = GAMEPLAY_FALLBACK[getDebugUltimateCharacter(character)]

  useUltimateStore.getState().onTriggered({
    character,
    ulti_id: gameplay.ulti_id,
    shape: gameplay.shape,
    cancellable: gameplay.cancellable ?? false,
    duration_ms: gameplay.duration_ms,
    payload: gameplay.payload,
  })
}

export const useDebugKeys = (): void => {
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return

      const { nextBall } = useGameStore.getState()

      switch (e.key.toLowerCase()) {
        case "b":
          triggerDebugUltimate()
          break
        case "k":
          broadcastEvent({ event_type: "BallLost", payload: {} })
          nextBall()
          break
      }
    }

    window.addEventListener("keydown", handler)
    return () => {
      window.removeEventListener("keydown", handler)
    }
  }, [])
}
