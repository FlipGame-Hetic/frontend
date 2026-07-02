import { easeOutCubic } from "./ease"
import type { EaseFn } from "./ease"

/**
 * Tracks an enter transition: `enter()` restarts progress at 0, which eases to 1
 * over `durationMs`. Before the first `enter()` it reports progress 1 (fully in),
 * so a scene shown without an explicit transition still renders normally.
 */
export class SceneTransition {
  private elapsedMs: number
  private readonly durationMs: number
  private readonly easing: EaseFn

  constructor(durationMs: number, easing: EaseFn = easeOutCubic) {
    this.durationMs = durationMs
    this.easing = easing
    this.elapsedMs = durationMs // start "done"
  }

  enter(): void {
    this.elapsedMs = 0
  }

  advance(deltaMs: number): void {
    if (this.elapsedMs >= this.durationMs) return
    this.elapsedMs = Math.min(this.durationMs, this.elapsedMs + deltaMs)
  }

  get progress(): number {
    if (this.durationMs <= 0) return 1
    return this.easing(this.elapsedMs / this.durationMs)
  }

  get done(): boolean {
    return this.elapsedMs >= this.durationMs
  }
}
