import { sfxSources, playSfx, playSfxSequence } from "./sfx"

const base = import.meta.env.BASE_URL

export const BOSS_APPEAR_VOLUME = 0.7

const navForward = sfxSources(base, "interface", "navigation_forward")
const navBackward = sfxSources(base, "interface", "navigation_backward")
const bossAppear = sfxSources(base, "boss", "appear")
const bossDefeated = sfxSources(base, "boss", "defeated")

export function playNavigationForward(): void {
  playSfx(navForward)
}

export function playNavigationBackward(): void {
  playSfx(navBackward)
}

export function playBossAppearSequence(onComplete: () => void): () => void {
  // The source peaks at 0 dBFS; keep headroom for cabinet mono summing / amplification.
  return playSfxSequence(
    bossAppear,
    { times: 2, trailingDelayMs: 200, volume: BOSS_APPEAR_VOLUME },
    onComplete,
  )
}

export function playBossDefeated(): void {
  playSfx(bossDefeated)
}
