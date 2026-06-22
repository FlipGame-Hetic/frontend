import type { GamePhase } from "./screenEvents"

export interface GameState {
  ballPosition: { x: number; y: number; z: number }
  score: [number, number]
  currentPlayer: 1 | 2
  phase: string
}

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
      return "playing"
    case "game_over":
      return "game_over"
    default:
      return "idle"
  }
}
