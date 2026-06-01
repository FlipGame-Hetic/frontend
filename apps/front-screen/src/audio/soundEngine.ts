import { Howl } from "howler"
import {
  MUSIC_DEFAULT_VOLUME,
  MUSIC_TRACKS,
  SFX_DEFAULT_VOLUME,
  SFX_GROUPS,
  SFX_PATHS,
} from "./soundConfig"

let sfxEnabled = true
let sfxVolume = SFX_DEFAULT_VOLUME
let musicEnabled = true
let musicVolume = MUSIC_DEFAULT_VOLUME

const sfxHowls = new Map<string, Howl>()
let currentMusic: Howl | null = null

const getSfxHowl = (path: string, pool: number): Howl => {
  const existing = sfxHowls.get(path)
  if (existing) return existing
  const h = new Howl({ src: [path], pool })
  sfxHowls.set(path, h)
  return h
}

const pickTrack = (): string => {
  const fallbackTrack = MUSIC_TRACKS[0]
  if (fallbackTrack === undefined) {
    throw new Error("No music tracks configured")
  }

  return MUSIC_TRACKS[Math.floor(Math.random() * MUSIC_TRACKS.length)] ?? fallbackTrack
}

const playMusicTrack = (path: string): void => {
  const h = new Howl({
    src: [path],
    volume: musicEnabled ? musicVolume : 0,
    onend: () => {
      currentMusic = null
      playMusicTrack(pickTrack())
    },
  })
  currentMusic = h
  h.play()
}

export const startMusic = (): void => {
  if (currentMusic) return
  playMusicTrack(pickTrack())
}

export const setSfxEnabled = (enabled: boolean): void => {
  sfxEnabled = enabled
}

export const setSfxVolume = (volume: number): void => {
  sfxVolume = volume
}

export const setMusicEnabled = (enabled: boolean): void => {
  musicEnabled = enabled
  if (!currentMusic) return
  if (enabled) {
    currentMusic.volume(musicVolume)
    currentMusic.play()
  } else {
    currentMusic.pause()
  }
}

export const setMusicVolume = (volume: number): void => {
  musicVolume = volume
  if (musicEnabled) {
    currentMusic?.volume(volume)
  }
}

export const playSfx = (name: string): void => {
  if (!sfxEnabled) return
  const path = SFX_PATHS[name]
  if (!path) return
  const pool = name === "flipper_up" || name === "flipper_down" ? 4 : 1
  const h = getSfxHowl(path, pool)
  h.volume(sfxVolume)
  h.play()
}

export const playRandomSfx = (group: string): void => {
  if (!sfxEnabled) return
  const paths = SFX_GROUPS[group]
  if (!paths?.length) return
  const path = paths[Math.floor(Math.random() * paths.length)]
  if (path === undefined) return
  const h = getSfxHowl(path, 4)
  h.volume(sfxVolume)
  h.play()
}
