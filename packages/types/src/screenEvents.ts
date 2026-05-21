import type { ScreenEnvelope, ScreenId, ScreenTarget } from "./screen"
import type { CharacterType } from "./player"

export const SCREEN_EVENT_TYPES = {
  PhaseChange: "phase_change",
  ScoreUpdate: "score_update",
  LifeUpdate: "life_update",
  ModeSelected: "mode_selected",
  CharacterSelected: "character_selected",
  StartGame: "start_game",
  MenuConfirm: "menu_confirm",
  MenuNext: "menu_next",
  MenuPrev: "menu_prev",
  BumperHit: "bumper_hit",
  SlingshotHit: "slingshot_hit",
  BallLost: "ball_lost",
  TargetHit: "target_hit",
} as const

export type ScreenEventType = (typeof SCREEN_EVENT_TYPES)[keyof typeof SCREEN_EVENT_TYPES]

export type GamePhase =
  | "idle"
  | "mode_select"
  | "character_select"
  | "playing"
  | "paused"
  | "game_over"

export type GameMode = "solo" | "duo" | "boss"

export interface PhaseChangeEvent {
  event_type: "phase_change"
  payload: { phase: GamePhase; ball?: number; player?: number }
}

export interface ScoreUpdateEvent {
  event_type: "score_update"
  payload: { score: number; player: number; ball: number }
}

export interface LifeUpdateEvent {
  event_type: "life_update"
  payload: { player: number; lives: number }
}

export interface ModeSelectedEvent {
  event_type: "mode_selected"
  payload: { mode: GameMode }
}

export interface CharacterSelectedEvent {
  event_type: "character_selected"
  payload: { player: number; character: CharacterType }
}

export interface StartGameEvent {
  event_type: "start_game"
  payload: { mode: GameMode; players: { player: number; character: CharacterType }[] }
}

export interface MenuConfirmEvent {
  event_type: "menu_confirm"
  payload: { context: "idle" | "mode_select" | "character_select" | "game_over" }
}

export interface MenuNextEvent {
  event_type: "menu_next"
  payload: Record<string, never>
}

export interface MenuPrevEvent {
  event_type: "menu_prev"
  payload: Record<string, never>
}

export interface BumperHitEvent {
  event_type: "bumper_hit"
  payload: { bumper_id: number }
}

export interface SlingshotHitEvent {
  event_type: "slingshot_hit"
  payload: { slingshot_id: number }
}

export interface BallLostEvent {
  event_type: "ball_lost"
  payload: { ball: number; player: number }
}

export interface TargetHitEvent {
  event_type: "target_hit"
  payload: { target_id: string }
}

export type ScreenEvent =
  | PhaseChangeEvent
  | ScoreUpdateEvent
  | LifeUpdateEvent
  | ModeSelectedEvent
  | CharacterSelectedEvent
  | StartGameEvent
  | MenuConfirmEvent
  | MenuNextEvent
  | MenuPrevEvent
  | BumperHitEvent
  | SlingshotHitEvent
  | BallLostEvent
  | TargetHitEvent

export function makeEnvelope(from: ScreenId, to: ScreenTarget, event: ScreenEvent): ScreenEnvelope {
  return { from, to, event_type: event.event_type, payload: event.payload }
}

export function isScreenEvent<T extends ScreenEvent["event_type"]>(
  envelope: ScreenEnvelope,
  type: T,
): envelope is ScreenEnvelope & Extract<ScreenEvent, { event_type: T }> {
  return envelope.event_type === type
}
