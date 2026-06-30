import { isScreenEvent, GAME_PHASE } from "@frontend/types"
import type { ComboDirection, GamePhase, ScreenEnvelope } from "@frontend/types"
import { parseComboSequence } from "./scenes/comboPayload"
import type { ScoreData } from "./scenes/ScoreScene"

/**
 * The subset of scene capabilities the router drives. Declared structurally
 * (not as the concrete scene classes) so the router depends on behaviour, not
 * implementations — which also makes it trivial to unit-test with mocks.
 */
export interface RoutableScenes {
  playing: { update(data: Partial<ScoreData>): void }
  game_over: { update(score: number): void }
  combo: { update(data: { sequence?: ComboDirection[] }): void }
  mode_select: { update(value: string): void }
  character_select: { update(value: string): void }
}

/**
 * React-owned side effects the router needs to trigger but does not own.
 * Keeps timer/state concerns in the component while routing/translation lives here.
 */
export interface ScreenEventHooks {
  onPhaseChange: (phase: GamePhase) => void
  onComboFlash: () => void
}

/**
 * Translates incoming WebSocket screen events into scene updates. This is the
 * single place that knows the backend event vocabulary, so adding/changing an
 * event type touches only this class — not the React component.
 */
export class ScreenEventRouter {
  private maxLives = 0

  constructor(
    private readonly scenes: RoutableScenes,
    private readonly hooks: ScreenEventHooks,
  ) {}

  handle(envelope: ScreenEnvelope): void {
    if (isScreenEvent(envelope, "phase_change")) {
      if (envelope.payload.phase === GAME_PHASE.Playing) this.maxLives = 0
      this.scenes.playing.update({
        player: envelope.payload.player ?? 1,
        ballNumber: envelope.payload.ball ?? 1,
      })
      this.hooks.onPhaseChange(envelope.payload.phase)
      return
    }

    if (isScreenEvent(envelope, "ScoreUpdate")) {
      const score = envelope.payload.score
      const ball = envelope.payload.ball ?? 1
      const player = envelope.payload.player !== undefined ? Number(envelope.payload.player) : 1
      const update: Partial<ScoreData> = { score, player, ballNumber: ball }
      if (envelope.payload.multiplier !== undefined) update.multiplier = envelope.payload.multiplier
      this.scenes.playing.update(update)
      this.scenes.game_over.update(score)
      return
    }

    if (isScreenEvent(envelope, "GameOver")) {
      this.scenes.game_over.update(envelope.payload.final_score)
      this.hooks.onPhaseChange(GAME_PHASE.GameOver)
      return
    }

    if (isScreenEvent(envelope, "ComboActivated")) {
      const sequence = parseComboSequence(envelope.payload.sequence)
      this.scenes.combo.update({ sequence })
      this.hooks.onComboFlash()
      return
    }

    if (isScreenEvent(envelope, "MultiplierUpdate")) {
      const { multiplier, duration_ms } = envelope.payload
      this.scenes.playing.update({
        multiplier,
        multiplierDurationMs: duration_ms ?? 0,
        multiplierStartedAt: duration_ms !== undefined ? performance.now() : 0,
      })
      return
    }

    if (isScreenEvent(envelope, "mode_selected")) {
      this.scenes.mode_select.update(envelope.payload.mode)
      return
    }

    if (isScreenEvent(envelope, "character_selected")) {
      this.scenes.character_select.update(envelope.payload.character)
      return
    }

    if (isScreenEvent(envelope, "LifeUpdate")) {
      const lives = envelope.payload.lives_remaining
      if (lives > this.maxLives) this.maxLives = lives
      this.scenes.playing.update({ lives, maxLives: this.maxLives })
    }
  }
}
