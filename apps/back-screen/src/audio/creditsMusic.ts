import { Howl } from "howler"
import { sfxSources } from "./sfx"

const creditsSrc = sfxSources(import.meta.env.BASE_URL, "music", "credits")

let howl: Howl | null = null

export function playCreditsMusic(): void {
  howl ??= new Howl({ src: creditsSrc, loop: true, volume: 0.55 })
  if (!howl.playing()) howl.play()
}

export function stopCreditsMusic(): void {
  howl?.stop()
}
