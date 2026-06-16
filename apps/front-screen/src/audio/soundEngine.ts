import { Howl } from "howler"
import { connectMusicNode } from "./musicAnalyser"
import {
  LOOPING_SFX_FADE_OUT_MS,
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
let currentTrackIndex = -1
let trackQueue: number[] = []

const musicChangeListeners = new Set<(index: number) => void>()

interface LoopingSfxState {
  fadeStopTimeout?: ReturnType<typeof setTimeout>
  howl: Howl
  keys: Set<string>
  soundId?: number
}

const loopingSfx = new Map<string, LoopingSfxState>()

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
  ramp_rolling: SFX_GAINS.ball ?? 1,
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

const getLoopingSfxState = (name: string): LoopingSfxState | null => {
  const existing = loopingSfx.get(name)
  if (existing) return existing

  const srcs = SFX_PATHS[name]
  if (!srcs) return null

  const state: LoopingSfxState = {
    howl: new Howl({ src: srcs, loop: true, pool: 1 }),
    keys: new Set(),
  }
  loopingSfx.set(name, state)
  return state
}

const getSfxGain = (name: string): number => KEY_TO_GAIN[name] ?? 1

const applyLoopingSfxVolume = (name: string, state: LoopingSfxState): void => {
  state.howl.volume(sfxEnabled ? sfxVolume * getSfxGain(name) : 0)
}

const clearFadeStop = (state: LoopingSfxState): void => {
  if (state.fadeStopTimeout === undefined) return
  clearTimeout(state.fadeStopTimeout)
  state.fadeStopTimeout = undefined
}

const startActiveLoop = (name: string, state: LoopingSfxState): void => {
  if (!sfxEnabled || state.keys.size === 0) return
  if (state.soundId !== undefined) {
    clearFadeStop(state)
    applyLoopingSfxVolume(name, state)
    return
  }
  applyLoopingSfxVolume(name, state)
  state.soundId = state.howl.play()
}

const stopActiveLoop = (state: LoopingSfxState): void => {
  if (state.soundId === undefined) return
  clearFadeStop(state)
  state.howl.stop(state.soundId)
  state.soundId = undefined
}

const fadeOutActiveLoop = (name: string, state: LoopingSfxState): void => {
  const soundId = state.soundId
  if (soundId === undefined) return
  clearFadeStop(state)

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!sfxEnabled || LOOPING_SFX_FADE_OUT_MS <= 0) {
    stopActiveLoop(state)
    return
  }

  const fromVolume = state.howl.volume()
  state.howl.fade(fromVolume, 0, LOOPING_SFX_FADE_OUT_MS, soundId)
  state.fadeStopTimeout = setTimeout(() => {
    state.fadeStopTimeout = undefined
    if (state.keys.size > 0 || state.soundId !== soundId) return
    stopActiveLoop(state)
    applyLoopingSfxVolume(name, state)
  }, LOOPING_SFX_FADE_OUT_MS)
}

const ensureMusicTracks = (): void => {
  if (MUSIC_TRACKS.length === 0) throw new Error("No music tracks configured")
}

const shuffleTrackIndexes = (): number[] => {
  ensureMusicTracks()
  const indexes = MUSIC_TRACKS.map((_, index) => index)
  for (let i = indexes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = indexes[i]
    const picked = indexes[j]
    if (current === undefined || picked === undefined) continue
    indexes[i] = picked
    indexes[j] = current
  }
  return indexes
}

const refillTrackQueue = (): void => {
  trackQueue = shuffleTrackIndexes()
  if (trackQueue.length > 1 && trackQueue[0] === currentTrackIndex) {
    const repeatedTrack = trackQueue.shift()
    if (repeatedTrack !== undefined) trackQueue.push(repeatedTrack)
  }
}

const nextTrackIndex = (): number => {
  if (trackQueue.length === 0) refillTrackQueue()
  const index = trackQueue.shift()
  if (index === undefined) throw new Error("No music tracks configured")
  return index
}

const notifyMusicChange = (index: number): void => {
  currentTrackIndex = index
  musicChangeListeners.forEach((cb) => {
    cb(index)
  })
}

const playTrackByIndex = (index: number): void => {
  const path = MUSIC_TRACKS[index]
  if (!path) return
  const h = new Howl({
    src: [path],
    volume: musicEnabled ? musicVolume : 0,
    onplay: () => {
      connectMusicNode(h)
    },
    onend: () => {
      if (currentMusic !== h) return
      currentMusic = null
      playTrackByIndex(nextTrackIndex())
    },
  })
  notifyMusicChange(index)
  currentMusic = h
  h.play()
}

export const startMusic = (): void => {
  if (currentMusic) return
  playTrackByIndex(nextTrackIndex())
}

export const getCurrentTrackIndex = (): number => currentTrackIndex

export const getMusicSeek = (): number => {
  const t = currentMusic?.seek()
  return typeof t === "number" ? t : 0
}

export const onMusicChange = (cb: (index: number) => void): (() => void) => {
  musicChangeListeners.add(cb)
  return () => {
    musicChangeListeners.delete(cb)
  }
}

export const setMusicTrack = (index: number): void => {
  if (index === currentTrackIndex) return
  if (index < 0 || index >= MUSIC_TRACKS.length) return
  trackQueue = trackQueue.filter((trackIndex) => trackIndex !== index)
  const toStop = currentMusic
  currentMusic = null
  if (toStop) {
    toStop.stop()
    toStop.unload()
  }
  playTrackByIndex(index)
}

export const setSfxEnabled = (enabled: boolean): void => {
  sfxEnabled = enabled
  for (const [name, state] of loopingSfx) {
    if (enabled) startActiveLoop(name, state)
    else stopActiveLoop(state)
  }
}

export const setSfxVolume = (volume: number): void => {
  sfxVolume = volume
  if (!sfxEnabled) return
  for (const [name, state] of loopingSfx) {
    if (state.keys.size > 0) applyLoopingSfxVolume(name, state)
  }
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
  const gain = getSfxGain(name)
  h.volume(sfxVolume * gain)
  h.play()
}

export const startLoopingSfx = (name: string, key: string): void => {
  const state = getLoopingSfxState(name)
  if (!state) return

  state.keys.add(key)
  startActiveLoop(name, state)
}

export const stopLoopingSfx = (name: string, key: string): void => {
  const state = loopingSfx.get(name)
  if (!state) return

  state.keys.delete(key)
  if (state.keys.size > 0) {
    applyLoopingSfxVolume(name, state)
    return
  }

  fadeOutActiveLoop(name, state)
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
