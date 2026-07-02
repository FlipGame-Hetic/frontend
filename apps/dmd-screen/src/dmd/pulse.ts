import { easeOutQuad } from "./ease"
import type { EaseFn } from "./ease"

/**
 * A one-shot pulse: `trigger()` snaps the value to 1, which then decays to 0 over
 * `durationMs`. Delta-time driven. Drives the multiplier flash and ambient glows.
 */
export class Pulse {
  private elapsedMs: number
  private readonly durationMs: number
  private readonly easing: EaseFn

  constructor(durationMs: number, easing: EaseFn = easeOutQuad) {
    this.durationMs = durationMs
    this.easing = easing
    this.elapsedMs = durationMs // start idle (value 0)
  }

  trigger(): void {
    this.elapsedMs = 0
  }

  advance(deltaMs: number): void {
    if (this.elapsedMs >= this.durationMs) return
    this.elapsedMs = Math.min(this.durationMs, this.elapsedMs + deltaMs)
  }

  get value(): number {
    if (this.durationMs <= 0 || this.elapsedMs >= this.durationMs) return 0
    return 1 - this.easing(this.elapsedMs / this.durationMs)
  }

  get active(): boolean {
    return this.value > 0
  }
}
