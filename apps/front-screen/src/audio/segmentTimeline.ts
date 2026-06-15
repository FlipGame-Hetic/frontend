import * as THREE from "three"
import {
  SEG_COLOR_LERP,
  SEG_COLOR_LERP_FAST,
  SEG_DROP_PULSE_DECAY,
  SEG_INTENSITY_ATTACK,
  SEG_INTENSITY_DECAY,
} from "./audioReactiveConfig"
import { getTrackSegments, type SegmentType } from "./musicSegments"
import { getCurrentTrackIndex, getMusicSeek } from "./soundEngine"

export interface SegmentState {
  active: boolean
  intensity: number
  color: THREE.Color
  type: SegmentType
  dropPulse: number
}

const state: SegmentState = {
  active: false,
  intensity: 0,
  color: new THREE.Color(0, 0.94, 1),
  type: "calm",
  dropPulse: 0,
}

const targetColor = new THREE.Color()
let lastTrack = -1
let lastSegStart = -1

const findSegmentIndex = (segments: { time: number }[], t: number): number => {
  let lo = 0
  let hi = segments.length - 1
  let result = 0
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const seg = segments[mid]
    if (seg && seg.time <= t) {
      result = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return result
}

const expLerp = (k: number, dt: number): number => 1 - Math.exp(-k * dt)

export const updateSegments = (dt: number): void => {
  state.dropPulse = Math.max(0, state.dropPulse * Math.exp(-SEG_DROP_PULSE_DECAY * dt))

  const track = getCurrentTrackIndex()
  const ts = getTrackSegments(track)
  if (!ts || ts.segments.length === 0) {
    state.active = false
    return
  }
  const t = getMusicSeek()
  const idx = findSegmentIndex(ts.segments, t)
  const seg = ts.segments[idx]
  if (!seg) {
    state.active = false
    return
  }
  state.active = true

  const isNewSegment = track !== lastTrack || seg.time !== lastSegStart
  if (isNewSegment) {
    if (seg.type === "drop") state.dropPulse = 1
    lastTrack = track
    lastSegStart = seg.time
  }

  // Transition d'intensité modulée par l'intensité du segment visé :
  // montée vers du fort = rapide/punchy ; descente vers du calme = lente/douce.
  const rising = seg.intensity > state.intensity
  const attackK = SEG_INTENSITY_ATTACK * (0.4 + 0.8 * seg.intensity)
  const k = rising ? attackK : SEG_INTENSITY_DECAY
  state.intensity += (seg.intensity - state.intensity) * expLerp(k, dt)

  // Couleur : transition snappy sur drops / mini-segments, douce sinon.
  targetColor.set(seg.color)
  const colorK = seg.type === "drop" ? SEG_COLOR_LERP_FAST : SEG_COLOR_LERP
  state.color.lerp(targetColor, expLerp(colorK, dt))

  state.type = seg.type
}

export const getSegmentState = (): Readonly<SegmentState> => state
