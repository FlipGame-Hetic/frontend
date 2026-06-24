import type { GameStateResponse } from "@frontend/types"
import { resolveApiUrl } from "./wsConfig"
import { wsWarn } from "./wsLog"

// Simple backend fetch to get game state on screen refresh
export async function fetchGameState(): Promise<GameStateResponse | null> {
  try {
    const res = await fetch(`${resolveApiUrl()}/api/v1/game/state`)
    if (!res.ok) return null
    return (await res.json()) as GameStateResponse
  } catch {
    wsWarn("resync", "fetchGameState failed — keeping current state")
    return null
  }
}
