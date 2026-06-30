import type { ButtonId } from "./buttons"
import type { CharacterType, UltiId, UltiPayload, UltiShape } from "./character"
import type { ScreenEnvelope, ScreenId, ScreenTarget } from "./screen"

export const GAME_PHASE = {
  Idle: "idle",
  ModeSelect: "mode_select",
  CharacterSelect: "character_select",
  Playing: "playing",
  Paused: "paused",
  GameOver: "game_over",
} as const

export type GamePhase = (typeof GAME_PHASE)[keyof typeof GAME_PHASE]

// Phases where the player can confirm (all of them except playing and paused game)
type MenuContext = Exclude<GamePhase, typeof GAME_PHASE.Playing | typeof GAME_PHASE.Paused>

export type GameMode = "solo" | "duo" | "boss"

export type ComboDirection = "L" | "R"
export type PlungerChargeSource = "under_plunger" | "plunger"
export type BallHitType = "bumper" | "rail" | "slingshot" | "drain" | "target" | "spinner"

export interface BallHitPayload {
  hits: {
    id: string
    type: BallHitType
    force: number
    position?: { x: number; z: number }
  }[]
}

// Payload for events that intentionally carry no data
type EmptyPayload = Record<string, never>

export interface ScoreEntry {
  id: number
  character_id: number
  score: number
  boss_reached: number
  created_at: string | null
}

// Source of truth: maps each `event_type` to its payload type.
interface ScreenEventPayloads {
  // snake_case - screen-to-screen communication (menu/phase coordination)
  phase_change: { phase: GamePhase; ball?: number; player?: number; score?: number }
  mode_selected: { mode: GameMode }
  character_selected: { player: number; character: CharacterType }
  start_game: { mode: GameMode; players: { player: number; character: CharacterType }[] }
  menu_confirm: { context: MenuContext }
  menu_back: EmptyPayload
  playfield_music: { playing: boolean }
  request_resync: EmptyPayload

  // PascalCase - backend / game-engine wire protocol. Can also be emitted by front-screen when running the game
  // --- Base-game workflow ---
  MenuButton: { id: ButtonId; state: number }
  StartGame: { player_id: string; character: string }
  PlungerCharge: { state: number; source?: PlungerChargeSource }
  BallInPlay: { in_play: boolean }
  FlipperLeft: { state: number }
  FlipperRight: { state: number }
  Bumper: { ball_id: string }
  BumperTriangle: { ball_id: string }
  BallHit: BallHitPayload
  RailStart: { ball_id: string }
  RailEnd: { ball_id: string }
  // Used to increment score, ultimate charge, multiplier...
  ScoreUpdate: {
    score: number
    multiplier?: number
    player?: string | number
    ball?: number
    ultimate_charge?: number
    ultimate_max?: number
    ulti_ready?: boolean
    next_ulti_id?: UltiId
  }
  // Used only to display score popup
  ScoreDelta: { delta: number; reason: string; total: number; ball_id?: string }

  // --- Bonus / S.P.A.M.E.R.-specific features ---

  MultiplierUpdate: { multiplier: number; duration_ms?: number }
  ComboActivated: { bonus_pts: number; sequence: string[] }
  MultiballTriggered: { ball_id: string }
  BallSaverReady: { ball_id?: string }
  PortalUsed: { ball_id: string }
  CapacityL2: EmptyPayload
  CapacityR2: EmptyPayload
  UltimateTriggered: {
    character: CharacterType
    ulti_id: UltiId
    shape: UltiShape
    cancellable: boolean
    activation_charge?: number
    duration_ms?: number
    payload?: UltiPayload
  }
  // Some drainable ultimates can be stopped
  UltimateStopped: { ulti_id: UltiId; ultimate_charge: number }
  BossUpdate: { boss_id: number; boss_hp: number; boss_max_hp: number }
  // Boss's hp dropped to 0
  BossDefeated: { boss_id: number }
  // After short delay, start counter before spawning new boss
  BossCleared: { boss_id: number }

  // --- Game end ---

  BallLost: EmptyPayload
  LifeUpdate: { lives_remaining: number }
  // Classic all balls lost scenario : Game over
  GameOver: { final_score: number }
  // End Game is different from Game Over : direct game shutdown trigger, not supposed to happen during normal game
  EndGame: EmptyPayload
  LeaderboardUpdate: ScoreEntry[]
}

type ScreenEventType = keyof ScreenEventPayloads

// Maps the ScreenEventType to create singulars ScreenEvent for each event type with corresponding payload
export type ScreenEvent = {
  [K in ScreenEventType]: { event_type: K; payload: ScreenEventPayloads[K] }
}[ScreenEventType]

// Extract is used to only keep the ScreenEvent with corresponding event_type
export type StartGameEvent = Extract<ScreenEvent, { event_type: "start_game" }>
export type UltimateTriggeredEvent = Extract<ScreenEvent, { event_type: "UltimateTriggered" }>
export type UltimateStoppedEvent = Extract<ScreenEvent, { event_type: "UltimateStopped" }>

export function makeEnvelope(from: ScreenId, to: ScreenTarget, event: ScreenEvent): ScreenEnvelope {
  return { from, to, event_type: event.event_type, payload: event.payload }
}

// Compares the type of the event in the envelope with an eventual corresponding type in the ScreenEvent map
export function isScreenEvent<T extends ScreenEvent["event_type"]>(
  envelope: ScreenEnvelope,
  type: T,
): envelope is ScreenEnvelope & Extract<ScreenEvent, { event_type: T }> {
  return envelope.event_type === type
}
