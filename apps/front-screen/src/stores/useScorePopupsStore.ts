import { create } from "zustand"
import { getAnyBallPosition, getBallPosition } from "@/components/balls/ballPositionRegistry"
import { getBallColorForCharacter } from "@/config/characterColors"
import useGameStore from "./useGameStore"

interface Position {
  x: number
  y: number
  z: number
}

interface ScorePopup {
  id: number
  amount: number
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
}

let nextId = 0

const HITS_CAP = 16
const HIT_EXPIRY_MS = 2000
const HIT_MATCH_WINDOW_MS = 1500

const pruneHits = (hits: HitRecord[], now: number): HitRecord[] => {
  const fresh = hits.filter((hit) => now - hit.ts < HIT_EXPIRY_MS)
  return fresh.length > HITS_CAP ? fresh.slice(fresh.length - HITS_CAP) : fresh
}

const getCurrentBallColor = (): string => {
  const { currentPlayer, selectedPlayers } = useGameStore.getState()
  const character = selectedPlayers.find((player) => player.player === currentPlayer)?.character

  return getBallColorForCharacter(character)
}

const useScorePopupsStore = create<ScorePopupsState>((set, get) => ({
  popups: [],
  recentHits: [],
  addPopup: (amount, position) => {
    const color = getCurrentBallColor()

    set((state) => ({
      popups: [...state.popups, { id: nextId++, amount, position, color }],
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
    let matchedHit: HitRecord | undefined

    let index = -1
    if (ballId) {
      for (let i = hits.length - 1; i >= 0; i--) {
        const hit = hits[i]
        if (hit?.ballId === ballId && now - hit.ts < HIT_MATCH_WINDOW_MS) {
          index = i
          matchedHit = hit
          break
        }
      }
    }
    if (index === -1 && reason) {
      index = hits.findIndex((hit) => hit.reason === reason)
      matchedHit = index >= 0 ? hits[index] : undefined
    }
    if (index === -1 && ballId) {
      for (let i = hits.length - 1; i >= 0; i--) {
        const hit = hits[i]
        if (hit?.ballId === ballId) {
          index = i
          matchedHit = hit
          break
        }
      }
    }

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
      popups: [...state.popups, { id: nextId++, amount, position, color }],
    }))
  },
}))

export default useScorePopupsStore
