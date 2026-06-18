import type { CharacterType } from "./character"
import type { ScreenEnvelope, ScreenId, ScreenTarget } from "./screen"

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
  MenuBack: "menu_back",
  UltimateActivated: "UltimateActivated",
  BumperHit: "bumper_hit",
  SlingshotHit: "slingshot_hit",
  BallLost: "ball_lost",
  TargetHit: "target_hit",
  MultiballTriggered: "MultiballTriggered",
  ComboActivated: "ComboActivated",
  MultiplierUpdate: "MultiplierUpdate",
  BossUpdate: "BossUpdate",
  BackBumper: "Bumper",
  BackBumperTriangle: "BumperTriangle",
  BackPortalUsed: "PortalUsed",
  BackFlipperLeft: "FlipperLeft",
  BackFlipperRight: "FlipperRight",
  PlungerCharge: "PlungerCharge",
  CapacityL2: "CapacityL2",
  CapacityR2: "CapacityR2",
  BackBallSaverReady: "BallSaverReady",
  RailStart: "RailStart",
  RailEnd: "RailEnd",
  BackBallLost: "BallLost",
  BackEndGame: "EndGame",
  BackStartGame: "StartGame",
  BackScoreUpdate: "ScoreUpdate",
  BackScoreDelta: "ScoreDelta",
  BackLifeUpdate: "LifeUpdate",
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
  payload: { phase: GamePhase; ball?: number; player?: number; score?: number }
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

export interface MenuBackEvent {
  event_type: "menu_back"
  payload: Record<string, never>
}

export interface UltimateActivatedEvent {
  event_type: "UltimateActivated"
  payload: { player_id: string }
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

export interface MultiballTriggeredEvent {
  event_type: "MultiballTriggered"
  payload: { ball_id: string }
}

export type ComboDirection = "L" | "R"

export interface ComboActivatedEvent {
  event_type: "ComboActivated"
  payload: {
    bonus_pts: number
    sequence: string[]
  }
}

export interface MultiplierUpdateEvent {
  event_type: "MultiplierUpdate"
  payload: { multiplier: number; duration_ms?: number }
}

export interface BossUpdateEvent {
  event_type: "BossUpdate"
  payload: { boss_id: number; boss_hp: number; boss_max_hp: number }
}

export interface BackBumperEvent {
  event_type: "Bumper"
  payload: { ball_id: string }
}

export interface BackBumperTriangleEvent {
  event_type: "BumperTriangle"
  payload: { ball_id: string }
}

export interface BackPortalUsedEvent {
  event_type: "PortalUsed"
  payload: { ball_id: string }
}

export interface BackFlipperLeftEvent {
  event_type: "FlipperLeft"
  payload: { state: number }
}

export interface BackFlipperRightEvent {
  event_type: "FlipperRight"
  payload: { state: number }
}

export interface PlungerChargeEvent {
  event_type: "PlungerCharge"
  payload: { state: number }
}

export interface CapacityL2Event {
  event_type: "CapacityL2"
  payload: null
}

export interface CapacityR2Event {
  event_type: "CapacityR2"
  payload: null
}

export interface BackBallSaverReadyEvent {
  event_type: "BallSaverReady"
  payload: { ball_id?: string }
}

export interface RailStartEvent {
  event_type: "RailStart"
  payload: { ball_id: string }
}

export interface RailEndEvent {
  event_type: "RailEnd"
  payload: { ball_id: string }
}

export interface BackBallLostEvent {
  event_type: "BallLost"
  payload: Record<string, never>
}

export interface BackEndGameEvent {
  event_type: "EndGame"
  payload: Record<string, never>
}

export interface BackStartGameEvent {
  event_type: "StartGame"
  payload: { player_id: string; character_id: number }
}

export interface BackScoreUpdateEvent {
  event_type: "ScoreUpdate"
  payload: { score: number; multiplier?: number; player?: string | number; ball?: number }
}

export interface BackScoreDeltaEvent {
  event_type: "ScoreDelta"
  payload: { delta: number; reason: string; total: number; ball_id?: string }
}

export interface BackLifeUpdateEvent {
  event_type: "LifeUpdate"
  payload: { lives_remaining: number }
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
  | MenuBackEvent
  | UltimateActivatedEvent
  | BumperHitEvent
  | SlingshotHitEvent
  | BallLostEvent
  | TargetHitEvent
  | MultiballTriggeredEvent
  | ComboActivatedEvent
  | MultiplierUpdateEvent
  | BossUpdateEvent
  | BackBumperEvent
  | BackBumperTriangleEvent
  | BackPortalUsedEvent
  | BackFlipperLeftEvent
  | BackFlipperRightEvent
  | PlungerChargeEvent
  | CapacityL2Event
  | CapacityR2Event
  | BackBallSaverReadyEvent
  | RailStartEvent
  | RailEndEvent
  | BackBallLostEvent
  | BackEndGameEvent
  | BackStartGameEvent
  | BackScoreUpdateEvent
  | BackScoreDeltaEvent
  | BackLifeUpdateEvent

export function makeEnvelope(from: ScreenId, to: ScreenTarget, event: ScreenEvent): ScreenEnvelope {
  return { from, to, event_type: event.event_type, payload: event.payload }
}

export function isScreenEvent<T extends ScreenEvent["event_type"]>(
  envelope: ScreenEnvelope,
  type: T,
): envelope is ScreenEnvelope & Extract<ScreenEvent, { event_type: T }> {
  return envelope.event_type === type
}
