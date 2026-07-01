/**
 * A small stack of transient text pop-ups (e.g. floating "+1500" score deltas).
 * Each item ages from progress 0 to 1 over `lifetimeMs`, then is culled. New
 * items past `max` drop the oldest so pops never clutter the display.
 */
export interface PopupView {
  text: string
  progress: number
}

interface PopupItem {
  text: string
  ageMs: number
}

export class PopupStack {
  private readonly lifetimeMs: number
  private readonly max: number
  private items_: PopupItem[] = []

  constructor(opts: { lifetimeMs: number; max?: number }) {
    this.lifetimeMs = opts.lifetimeMs
    this.max = opts.max ?? 4
  }

  push(text: string): void {
    this.items_.push({ text, ageMs: 0 })
    if (this.items_.length > this.max) this.items_.shift()
  }

  advance(deltaMs: number): void {
    for (const item of this.items_) item.ageMs += deltaMs
    this.items_ = this.items_.filter((i) => i.ageMs < this.lifetimeMs)
  }

  get items(): readonly PopupView[] {
    return this.items_.map((i) => ({
      text: i.text,
      progress: this.lifetimeMs <= 0 ? 1 : Math.min(1, i.ageMs / this.lifetimeMs),
    }))
  }
}
