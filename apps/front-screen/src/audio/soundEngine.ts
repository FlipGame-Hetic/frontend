import { Howl } from "howler"
import {
  MUSIC_DEFAULT_VOLUME,
  MUSIC_TRACKS,
  SFX_DEFAULT_VOLUME,
  SFX_GAINS,
  SFX_GROUPS,
  SFX_PATHS,
} from "./soundConfig"

let sfxEnabled = true
let sfxVolume = SFX_DEFAULT_VOLUME
let musicEnabled = true
let musicVolume = MUSIC_DEFAULT_VOLUME

const sfxHowls = new Map<string, Howl>()
let currentMusic: Howl | null = null

const KEY_TO_GAIN: Record<string, number> = {
  flipper_up: SFX_GAINS.flipper ?? 1,
  flipper_down: SFX_GAINS.flipper ?? 1,
  plunger_launch: SFX_GAINS.plunger ?? 1,
  ballsaver_up: SFX_GAINS.ballsaver ?? 1,
  game_over: SFX_GAINS.score ?? 1,
  multiball_triggered: SFX_GAINS.multiball ?? 1,
  hit0: SFX_GAINS.multiball ?? 1,
  hit1: SFX_GAINS.multiball ?? 1,
  hit2: SFX_GAINS.multiball ?? 1,
  hit3: SFX_GAINS.multiball ?? 1,
  hit4: SFX_GAINS.multiball ?? 1,
  hit5: SFX_GAINS.multiball ?? 1,
  hit6: SFX_GAINS.multiball ?? 1,
  hit7: SFX_GAINS.multiball ?? 1,
  hit8: SFX_GAINS.multiball ?? 1,
  hit9: SFX_GAINS.multiball ?? 1,
  ball_new: SFX_GAINS.ball ?? 1,
}

const GROUP_TO_GAIN: Record<string, number> = {
  ball_lost: SFX_GAINS.ball ?? 1,
  portal_enter: SFX_GAINS.portal ?? 1,
  portal_exit: SFX_GAINS.portal ?? 1,
  bumpers: SFX_GAINS.bumpers ?? 1,
  slingshots: SFX_GAINS.slingshots ?? 1,
  targets: SFX_GAINS.targets ?? 1,
}

const getSfxHowl = (srcs: [string, string], pool: number): Howl => {
  const existing = sfxHowls.get(srcs[0])
  if (existing) return existing
  const h = new Howl({ src: srcs, pool })
  sfxHowls.set(srcs[0], h)
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
  const srcs = SFX_PATHS[name]
  if (!srcs) return
  const pool = name === "flipper_up" || name === "flipper_down" ? 4 : 1
  const h = getSfxHowl(srcs, pool)
  const gain = KEY_TO_GAIN[name] ?? 1
  h.volume(sfxVolume * gain)
  h.play()
}

export const playRandomSfx = (group: string): void => {
  if (!sfxEnabled) return
  const variants = SFX_GROUPS[group]
  if (!variants?.length) return
  const srcs = variants[Math.floor(Math.random() * variants.length)]
  if (srcs === undefined) return
  const h = getSfxHowl(srcs, 4)
  const gain = GROUP_TO_GAIN[group] ?? 1
  h.volume(sfxVolume * gain)
  h.play()
}
