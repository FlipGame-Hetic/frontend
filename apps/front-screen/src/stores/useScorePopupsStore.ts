import { create } from "zustand"
import { getAnyBallPosition, getBallPosition } from "@/components/balls/ballPositionRegistry"

interface Position {
  x: number
  y: number
  z: number
}

interface ScorePopup {
  id: number
  amount: number
  position: Position
}

interface HitRecord {
  ballId?: string
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
}

let nextId = 0

const HITS_CAP = 16
const HIT_EXPIRY_MS = 2000
const HIT_MATCH_WINDOW_MS = 1500

const pruneHits = (hits: HitRecord[], now: number): HitRecord[] => {
  const fresh = hits.filter((hit) => now - hit.ts < HIT_EXPIRY_MS)
  return fresh.length > HITS_CAP ? fresh.slice(fresh.length - HITS_CAP) : fresh
}

const useScorePopupsStore = create<ScorePopupsState>((set, get) => ({
  popups: [],
  recentHits: [],
  addPopup: (amount, position) => {
    set((state) => ({
      popups: [...state.popups, { id: nextId++, amount, position }],
    }))
  },
  removePopup: (id) => {
    set((state) => ({ popups: state.popups.filter((p) => p.id !== id) }))
  },
  recordHit: (position, ballId, reason) => {
    const now = performance.now()
    set((state) => ({
      recentHits: pruneHits([...state.recentHits, { ballId, reason, position, ts: now }], now),
    }))
  },
  spawnPopupFromDelta: (amount, reason, ballId) => {
    if (amount === 0) return

    const now = performance.now()
    const hits = pruneHits(get().recentHits, now)

    let index = -1
    if (ballId) {
      for (let i = hits.length - 1; i >= 0; i--) {
        if (hits[i].ballId === ballId && now - hits[i].ts < HIT_MATCH_WINDOW_MS) {
          index = i
          break
        }
      }
    }
    if (index === -1 && reason) {
      index = hits.findIndex((hit) => hit.reason === reason)
    }
    if (index === -1 && ballId) {
      for (let i = hits.length - 1; i >= 0; i--) {
        if (hits[i].ballId === ballId) {
          index = i
          break
        }
      }
    }

    let position: Position
    if (index >= 0) {
      position = hits[index].position
    } else {
      position = (ballId ? getBallPosition(ballId) : undefined) ??
        getAnyBallPosition() ?? { x: 0, y: 0, z: 0 }
    }
    const remainingHits = index >= 0 ? hits.filter((_, i) => i !== index) : hits

    set((state) => ({
      recentHits: remainingHits,
      popups: [...state.popups, { id: nextId++, amount, position }],
    }))
  },
}))

export default useScorePopupsStore
