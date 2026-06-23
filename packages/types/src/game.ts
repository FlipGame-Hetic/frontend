import type { GamePhase } from "./screenEvents"
import { GAME_PHASE } from "./screenEvents"

// Not a game phase, that is only used in the payload from the reconnnect game state fetch
export type EnginePhase = "idle" | "in_game" | "game_over"

export interface GameStateResponse {
  phase: EnginePhase
  score: number
  lives: number
  active_multiplier: number
  ultimate_charge: number
  ultimate_max: number
  shield_active: boolean
  boss_hp_percent: number | null
}

export const mapEnginePhaseToGamePhase = (phase: EnginePhase): GamePhase => {
  switch (phase) {
    case "in_game":
      return GAME_PHASE.Playing
    case "game_over":
      return GAME_PHASE.GameOver
    default:
      return GAME_PHASE.Idle
  }
}
