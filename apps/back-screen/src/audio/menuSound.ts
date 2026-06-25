import { sfxSources, playSfx, playSfxSequence } from "./sfx"

const base = import.meta.env.BASE_URL

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
  return playSfxSequence(bossAppear, { times: 2, trailingDelayMs: 200 }, onComplete)
}

export function playBossDefeated(): void {
  playSfx(bossDefeated)
}
