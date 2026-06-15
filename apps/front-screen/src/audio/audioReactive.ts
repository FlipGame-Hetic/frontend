import * as THREE from "three"
import {
  BAND_ATTACK,
  BAND_DECAY,
  BASELINE_RATE,
  BEAT_DECAY_K,
  BEAT_FAST_K,
  BEAT_SENSITIVITY,
  BEAT_SLOW_K,
  ENERGY_K,
  HUE_ENERGY_BOOST,
  HUE_SPEED,
  NEON_PALETTE_A,
  NEON_PALETTE_B,
  NEON_PALETTE_C,
  NEON_PALETTE_D,
  PEAK_DECAY,
  SEG_BASE,
  SEG_FFT_MIX,
  SWELL_ATTACK,
  SWELL_DECAY,
} from "./audioReactiveConfig"
import { getFrequencyData } from "./musicAnalyser"
import { getSegmentState, updateSegments } from "./segmentTimeline"

export interface AudioReactiveState {
  bass: number
  mid: number
  high: number
  energy: number
  swell: number
  beat: number
  dropPulse: number
  color: THREE.Color
}

const state: AudioReactiveState = {
  bass: 0,
  mid: 0,
  high: 0,
  energy: 0,
  swell: 0,
  beat: 0,
  dropPulse: 0,
  color: new THREE.Color(0, 0.94, 1),
}

let fftEnergy = 0
let fftSwell = 0

const BASS_END = 0.06
const MID_END = 0.18
const HIGH_END = 0.5

let bassBaseline = 0,
  bassPeak = 0.01
let midBaseline = 0,
  midPeak = 0.01
let highBaseline = 0,
  highPeak = 0.01
let bassFast = 0,
  bassSlow = 0
let bassSmooth = 0,
  midSmooth = 0,
  highSmooth = 0
let huePhase = 0

const bandAvg = (data: Uint8Array, s: number, e: number): number => {
  const count = e - s
  if (count <= 0) return 0
  let sum = 0
  for (let i = s; i < e; i++) sum += data[i] ?? 0
  return sum / count / 255
}

const ema = (cur: number, tgt: number, k: number, dt: number): number =>
  cur + (tgt - cur) * (1 - Math.exp(-k * dt))

const cospal = (
  t: number,
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  c: readonly [number, number, number],
  d: readonly [number, number, number],
): [number, number, number] => {
  const TAU = Math.PI * 2
  return [
    a[0] + b[0] * Math.cos(TAU * (c[0] * t + d[0])),
    a[1] + b[1] * Math.cos(TAU * (c[1] * t + d[1])),
    a[2] + b[2] * Math.cos(TAU * (c[2] * t + d[2])),
  ]
}

export const updateAudioReactive = (dt: number): void => {
  const data = getFrequencyData()
  const n = data?.length ?? 512

  let bassRaw = 0,
    midRaw = 0,
    highRaw = 0
  if (data) {
    const be = Math.floor(n * BASS_END)
    const me = Math.floor(n * MID_END)
    const he = Math.floor(n * HIGH_END)
    bassRaw = bandAvg(data, 0, be)
    midRaw = bandAvg(data, be, me)
    highRaw = bandAvg(data, me, he)
  }

  bassBaseline = ema(bassBaseline, bassRaw, BASELINE_RATE, dt)
  midBaseline = ema(midBaseline, midRaw, BASELINE_RATE, dt)
  highBaseline = ema(highBaseline, highRaw, BASELINE_RATE, dt)

  bassPeak = Math.max(bassRaw, bassPeak * Math.exp(-PEAK_DECAY * dt))
  midPeak = Math.max(midRaw, midPeak * Math.exp(-PEAK_DECAY * dt))
  highPeak = Math.max(highRaw, highPeak * Math.exp(-PEAK_DECAY * dt))

  const bassRel = Math.min(
    1,
    Math.max(0, (bassRaw - bassBaseline) / (bassPeak - bassBaseline + 0.001)),
  )
  const midRel = Math.min(1, Math.max(0, (midRaw - midBaseline) / (midPeak - midBaseline + 0.001)))
  const highRel = Math.min(
    1,
    Math.max(0, (highRaw - highBaseline) / (highPeak - highBaseline + 0.001)),
  )

  bassSmooth = ema(bassSmooth, bassRel, bassRel > bassSmooth ? BAND_ATTACK : BAND_DECAY, dt)
  midSmooth = ema(midSmooth, midRel, midRel > midSmooth ? BAND_ATTACK : BAND_DECAY, dt)
  highSmooth = ema(highSmooth, highRel, highRel > highSmooth ? BAND_ATTACK : BAND_DECAY, dt)

  state.bass = bassSmooth
  state.mid = midSmooth
  state.high = highSmooth

  bassFast = ema(bassFast, bassRaw, BEAT_FAST_K, dt)
  bassSlow = ema(bassSlow, bassRaw, BEAT_SLOW_K, dt)
  const beatRaw = Math.min(
    1,
    Math.max(0, ((bassFast - bassSlow) / (bassSlow + 0.001)) * BEAT_SENSITIVITY),
  )
  state.beat = Math.max(beatRaw, state.beat * Math.exp(-BEAT_DECAY_K * dt))

  const energyTarget = bassRel * 0.5 + midRel * 0.35 + highRel * 0.15
  fftEnergy = ema(fftEnergy, energyTarget, ENERGY_K, dt)
  fftSwell = ema(fftSwell, fftEnergy, fftEnergy > fftSwell ? SWELL_ATTACK : SWELL_DECAY, dt)

  // Hybride : les segments scriptés posent la macro (intensité + couleur),
  // la FFT live ajoute le détail micro ; fallback FFT pur sans segments.
  updateSegments(dt)
  const seg = getSegmentState()
  if (seg.active) {
    const detail = SEG_BASE + SEG_FFT_MIX * fftSwell
    const macro = Math.min(1, seg.intensity * detail)
    state.energy = macro
    state.swell = macro
    state.color.copy(seg.color)
    state.dropPulse = seg.dropPulse
  } else {
    state.energy = fftEnergy
    state.swell = fftSwell
    state.dropPulse = 0
    huePhase += dt * (HUE_SPEED + fftEnergy * HUE_ENERGY_BOOST)
    const [r, g, b] = cospal(
      huePhase,
      NEON_PALETTE_A,
      NEON_PALETTE_B,
      NEON_PALETTE_C,
      NEON_PALETTE_D,
    )
    state.color.setRGB(Math.max(0, r), Math.max(0, g), Math.max(0, b))
  }
}

export const getAudioReactive = (): Readonly<AudioReactiveState> => state
