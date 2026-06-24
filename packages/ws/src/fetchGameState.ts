import type { GameStateResponse } from "@frontend/types"
import { resolveApiUrl } from "./wsConfig"

// Simple backend fetch to get game state on screen refresh
export async function fetchGameState(): Promise<GameStateResponse | null> {
  try {
    const res = await fetch(`${resolveApiUrl()}/api/v1/game/state`)
    if (!res.ok) return null
    return (await res.json()) as GameStateResponse
  } catch {
    console.warn("[ws] fetchGameState failed — keeping current state")
    return null
  }
}
