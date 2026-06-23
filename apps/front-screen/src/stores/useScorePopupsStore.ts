import {
  getAnyBallPosition,
  getBallPosition,
} from "@/components/balls/runtime/ballPositionRegistry"
import { getCurrentBallColor } from "@/components/balls/runtime/ballUserData"
import { create } from "zustand"

interface Position {
  x: number
  y: number
  z: number
}

type ScorePopupKind = "score" | "multiball-countdown" | "multiball-trigger"

interface ScorePopup {
  id: number
  kind: ScorePopupKind
  amount?: number
  text?: string
  position: Position
  color: string
}

interface HitRecord {
  ballId?: string
  color: string
  reason?: string
  position: Position
  ts: number
}

interface ScorePopupsState {
  popups: ScorePopup[]
  recentHits: HitRecord[]
  addPopup: (amount: number, position: Position) => void
  removePopup: (id: number) => void
  recordHit: (position: Position, ballId?: string, reason?: string) => void
  spawnPopupFromDelta: (amount: number, reason?: string, ballId?: string) => void
  spawnMultiballCountdownPopup: (remaining: number, position: Position) => void
  spawnMultiballTriggeredPopup: (position: Position) => void
}

let nextId = 0

const HITS_CAP = 16
const HIT_EXPIRY_MS = 2000
const HIT_MATCH_WINDOW_MS = 1500

const pruneHits = (hits: HitRecord[], now: number): HitRecord[] => {
  const fresh = hits.filter((hit) => now - hit.ts < HIT_EXPIRY_MS)
  return fresh.length > HITS_CAP ? fresh.slice(fresh.length - HITS_CAP) : fresh
}

const findMatchingHit = (
  hits: HitRecord[],
  now: number,
  reason?: string,
  ballId?: string,
): { index: number; hit?: HitRecord } => {
  // Prefer a recent hit from the same ball for precise collision popup placement
  if (ballId) {
    for (let i = hits.length - 1; i >= 0; i--) {
      const hit = hits[i]
      if (hit?.ballId === ballId && now - hit.ts < HIT_MATCH_WINDOW_MS) {
        return { index: i, hit }
      }
    }
  }
  // Fallback to the scoring reason when the delta cannot be matched to a recent ball hit
  if (reason) {
    const index = hits.findIndex((hit) => hit.reason === reason)
    if (index >= 0) return { index, hit: hits[index] }
  }
  // Last chance: keep any hit from the same ball, even outside the match window
  if (ballId) {
    for (let i = hits.length - 1; i >= 0; i--) {
      const hit = hits[i]
      if (hit?.ballId === ballId) {
        return { index: i, hit }
      }
    }
  }
  return { index: -1 }
}

const useScorePopupsStore = create<ScorePopupsState>((set, get) => ({
  popups: [],
  recentHits: [],
  addPopup: (amount, position) => {
    const color = getCurrentBallColor()

    set((state) => ({
      popups: [...state.popups, { id: nextId++, kind: "score", amount, position, color }],
    }))
  },
  removePopup: (id) => {
    set((state) => ({ popups: state.popups.filter((p) => p.id !== id) }))
  },
  recordHit: (position, ballId, reason) => {
    const now = performance.now()
    const color = getCurrentBallColor()

    set((state) => ({
      recentHits: pruneHits(
        [...state.recentHits, { ballId, color, reason, position, ts: now }],
        now,
      ),
    }))
  },
  spawnPopupFromDelta: (amount, reason, ballId) => {
    if (amount === 0) return

    const now = performance.now()
    const hits = pruneHits(get().recentHits, now)
    const { index, hit: matchedHit } = findMatchingHit(hits, now, reason, ballId)

    let position: Position
    if (matchedHit) {
      position = matchedHit.position
    } else {
      position = (ballId ? getBallPosition(ballId) : undefined) ??
        getAnyBallPosition() ?? { x: 0, y: 0, z: 0 }
    }
    const color = matchedHit?.color ?? getCurrentBallColor()
    const remainingHits = index >= 0 ? hits.filter((_, i) => i !== index) : hits

    set((state) => ({
      recentHits: remainingHits,
      popups: [...state.popups, { id: nextId++, kind: "score", amount, position, color }],
    }))
  },
  spawnMultiballCountdownPopup: (remaining, position) => {
    const color = getCurrentBallColor()

    set((state) => ({
      popups: [
        ...state.popups,
        {
          id: nextId++,
          kind: "multiball-countdown",
          text: String(remaining),
          position,
          color,
        },
      ],
    }))
  },
  spawnMultiballTriggeredPopup: (position) => {
    const color = getCurrentBallColor()

    set((state) => ({
      popups: [
        ...state.popups,
        {
          id: nextId++,
          kind: "multiball-trigger",
          text: "MULTIBALL",
          position,
          color,
        },
      ],
    }))
  },
}))

export default useScorePopupsStore
