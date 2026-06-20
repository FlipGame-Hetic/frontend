import { Howl } from "howler"

export type SfxSrc = [string, string]

const sfxHowls = new Map<string, Howl>()

export const sfxSources = (base: string, dir: string, name: string): SfxSrc => [
  `${base}sounds/${dir}/${name}.ogg`,
  `${base}sounds/${dir}/${name}.m4a`,
]

interface PlaySfxOptions {
  volume?: number
}

export const playSfx = (src: SfxSrc, options?: PlaySfxOptions): Howl => {
  const cacheKey = src.join("\0")
  const existing = sfxHowls.get(cacheKey)
  const howl = existing ?? new Howl({ src })
  if (!existing) sfxHowls.set(cacheKey, howl)
  howl.volume(options?.volume ?? 1)
  howl.play()
  return howl
}

interface SfxSequenceOptions {
  times: number
  trailingDelayMs: number
  volume?: number
}

export const playSfxSequence = (
  src: SfxSrc,
  options: SfxSequenceOptions,
  onComplete: () => void,
): (() => void) => {
  const howl = new Howl({ src, volume: options.volume })
  let played = 0
  let cancelled = false
  let unloaded = false
  let timeout: ReturnType<typeof setTimeout> | undefined

  const cleanup = () => {
    if (timeout !== undefined) {
      clearTimeout(timeout)
      timeout = undefined
    }
    if (unloaded) return
    unloaded = true
    howl.unload()
  }

  howl.on("end", () => {
    if (cancelled) return
    played += 1
    if (played < options.times) {
      howl.play()
      return
    }
    timeout = setTimeout(() => {
      timeout = undefined
      if (cancelled) return
      cleanup()
      onComplete()
    }, options.trailingDelayMs)
  })

  howl.play()

  return () => {
    cancelled = true
    cleanup()
  }
}
