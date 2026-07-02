import { easeOutCubic } from "./ease"
import type { EaseFn } from "./ease"

/**
 * A number that eases toward a target over a fixed duration. Delta-time driven,
 * so it survives frame drops. Drives the score roll-up (odometer) effect and
 * supports both increasing and decreasing targets (e.g. a tilt penalty).
 */
export class AnimatedNumber {
  private from: number
  private to: number
  private progressMs: number
  private readonly durationMs: number
  private readonly easing: EaseFn

  constructor(initial: number, durationMs = 400, easing: EaseFn = easeOutCubic) {
    this.from = initial
    this.to = initial
    this.durationMs = durationMs
    this.easing = easing
    this.progressMs = durationMs // start settled at `initial`
  }

  setTarget(n: number): void {
    if (n === this.to) return
    this.from = this.value
    this.to = n
    this.progressMs = 0
  }

  advance(deltaMs: number): void {
    if (this.progressMs >= this.durationMs) return
    this.progressMs = Math.min(this.durationMs, this.progressMs + deltaMs)
  }

  get value(): number {
    if (this.durationMs <= 0) return this.to
    const t = this.easing(this.progressMs / this.durationMs)
    return this.from + (this.to - this.from) * t
  }
}
