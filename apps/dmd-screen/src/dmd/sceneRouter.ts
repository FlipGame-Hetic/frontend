import { isScreenEvent, GAME_PHASE } from "@frontend/types"
import type { ComboDirection, GamePhase, ScreenEnvelope } from "@frontend/types"
import { parseComboSequence } from "./scenes/comboPayload"

/**
 * The subset of scene capabilities the router drives. Declared structurally
 * (not as the concrete scene classes) so the router depends on behaviour, not
 * implementations — which also makes it trivial to unit-test with mocks.
 */
export interface RoutableScenes {
  playing: {
    setScore(score: number): void
    setMultiplier(multiplier: number, durationMs?: number): void
    setLives(lives: number, maxLives: number): void
    pushDelta(delta: number): void
    enter(): void
  }
  game_over: { update(score: number): void; enter(): void }
  combo: { update(data: { sequence?: ComboDirection[] }): void }
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
      if (envelope.payload.phase === GAME_PHASE.Playing) {
        this.maxLives = 0
        this.scenes.playing.enter()
      } else if (envelope.payload.phase === GAME_PHASE.GameOver) {
        this.scenes.game_over.enter()
      }
      this.hooks.onPhaseChange(envelope.payload.phase)
      return
    }

    if (isScreenEvent(envelope, "ScoreUpdate")) {
      const score = envelope.payload.score
      this.scenes.playing.setScore(score)
      if (envelope.payload.multiplier !== undefined) {
        this.scenes.playing.setMultiplier(envelope.payload.multiplier)
      }
      this.scenes.game_over.update(score)
      return
    }

    if (isScreenEvent(envelope, "ScoreDelta")) {
      this.scenes.playing.pushDelta(envelope.payload.delta)
      return
    }

    if (isScreenEvent(envelope, "GameOver")) {
      this.scenes.game_over.update(envelope.payload.final_score)
      this.scenes.game_over.enter()
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
      this.scenes.playing.setMultiplier(multiplier, duration_ms)
      return
    }

    if (isScreenEvent(envelope, "LifeUpdate")) {
      const lives = envelope.payload.lives_remaining
      if (lives > this.maxLives) this.maxLives = lives
      this.scenes.playing.setLives(lives, this.maxLives)
    }
  }
}
