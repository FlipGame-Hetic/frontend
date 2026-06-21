import { playSfx } from "@/audio/soundEngine"
import { SHAKE_INTENSITY } from "@/components/screenShake/screenShakeConfig"
import useBallStore from "@/stores/useBallStore"
import useScreenShakeStore from "@/stores/useScreenShakeStore"
import { broadcastEvent } from "@frontend/ws"
import type { Vector3Tuple } from "three"
import { create } from "zustand"

const BOUNCE_DEBOUNCE_MS = 200

const spawnTimers = new Set<ReturnType<typeof setTimeout>>()
const lastBounceTimeByBall = new Map<string, number>()

interface RegisterMultiballBounceOptions {
  ballId: string
  threshold: number
  spawnPositions: [Vector3Tuple, Vector3Tuple]
  spawnIntervalMs: number
  ballCount: number
}

const isCounterLocked = (): boolean => {
  return useBallStore.getState().playingBallIds.length > 1 || spawnTimers.size > 0
}

const pruneExpiredBounceTimes = (now = performance.now()): void => {
  for (const [ballId, lastTime] of lastBounceTimeByBall) {
    if (now - lastTime >= BOUNCE_DEBOUNCE_MS) lastBounceTimeByBall.delete(ballId)
  }
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

export const getMultiballDebugSnapshot = () => {
  pruneExpiredBounceTimes()

  return {
    spawnTimers: spawnTimers.size,
    lastBounceTimes: lastBounceTimeByBall.size,
    lockedByActiveMultiball: isCounterLocked(),
  }
}

const useMultiballStore = create<MultiballStore>()((set, get) => {
  return {
    bounceCount: 0,

    registerBounce: ({ ballId, threshold, spawnPositions, spawnIntervalMs, ballCount }) => {
      const now = performance.now()
      pruneExpiredBounceTimes(now)

      const state = get()
      if (isCounterLocked()) return { status: "ignored" }

      const lastTime = lastBounceTimeByBall.get(ballId)
      if (lastTime !== undefined && now - lastTime < BOUNCE_DEBOUNCE_MS) {
        return { status: "ignored" }
      }
      lastBounceTimeByBall.set(ballId, now)

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
          spawnTimers.delete(timer)
          const pos = Math.random() < 0.5 ? spawnPositions[0] : spawnPositions[1]
          spawnBall(pos, { isPlaying: true })
        }, i * spawnIntervalMs)
        spawnTimers.add(timer)
      }

      return { status: "triggered" }
    },

    reset: () => {
      for (const t of spawnTimers) clearTimeout(t)
      spawnTimers.clear()
      lastBounceTimeByBall.clear()
      set({ bounceCount: 0 })
    },
  }
})

export default useMultiballStore
