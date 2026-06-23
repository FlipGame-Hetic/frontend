import { playSfx } from "@/audio/soundEngine"
import {
  clearMultiballBounceState,
  isBounceDebounced,
  isMultiballCounterLocked,
  pruneExpiredBounceTimes,
  recordBounceTime,
  trackSpawnTimer,
  untrackSpawnTimer,
} from "@/components/bonusZone/multiballGate/multiballBounceState"
import { SHAKE_INTENSITY } from "@/components/screenShake/screenShakeConfig"
import useBallStore from "@/stores/useBallStore"
import useScreenShakeStore from "@/stores/useScreenShakeStore"
import { broadcastEvent } from "@frontend/ws"
import type { Vector3Tuple } from "three"
import { create } from "zustand"

interface RegisterMultiballBounceOptions {
  ballId: string
  threshold: number
  spawnPositions: [Vector3Tuple, Vector3Tuple]
  spawnIntervalMs: number
  ballCount: number
}

export type MultiballBounceResult =
  | { status: "ignored" }
  | { status: "progress"; remaining: number }
  | { status: "triggered" }

interface MultiballStore {
  bounceCount: number
  registerBounce: (options: RegisterMultiballBounceOptions) => MultiballBounceResult
  reset: () => void
}

const useMultiballStore = create<MultiballStore>()((set, get) => {
  return {
    bounceCount: 0,

    registerBounce: ({ ballId, threshold, spawnPositions, spawnIntervalMs, ballCount }) => {
      const now = performance.now()
      pruneExpiredBounceTimes(now)

      const state = get()
      if (isMultiballCounterLocked()) return { status: "ignored" }

      if (isBounceDebounced(ballId, now)) return { status: "ignored" }
      recordBounceTime(ballId, now)

      const nextCount = state.bounceCount + 1

      if (nextCount < threshold) {
        const hitIndex = Math.min(nextCount - 1, 9)
        playSfx(`hit${String(hitIndex)}`)
        useScreenShakeStore.getState().addTrauma(SHAKE_INTENSITY.multiballBounce)
        set({ bounceCount: nextCount })
        return { status: "progress", remaining: threshold - nextCount }
      }

      playSfx("multiball_triggered")
      broadcastEvent({ event_type: "MultiballTriggered", payload: { ball_id: ballId } })
      useScreenShakeStore.getState().addTrauma(SHAKE_INTENSITY.multiballTrigger)
      set({ bounceCount: 0 })

      const spawnBall = useBallStore.getState().spawnBall
      for (let i = 0; i < ballCount; i++) {
        const timer = setTimeout(() => {
          untrackSpawnTimer(timer)
          const pos = Math.random() < 0.5 ? spawnPositions[0] : spawnPositions[1]
          spawnBall(pos, { isPlaying: true })
        }, i * spawnIntervalMs)
        trackSpawnTimer(timer)
      }

      return { status: "triggered" }
    },

    reset: () => {
      clearMultiballBounceState()
      set({ bounceCount: 0 })
    },
  }
})

export default useMultiballStore
