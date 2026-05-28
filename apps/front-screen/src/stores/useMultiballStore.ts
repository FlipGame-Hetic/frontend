import useBallStore from "@/stores/useBallStore"
import { playSfx } from "@/audio/soundEngine"
import { broadcastEvent } from "@frontend/ws"
import { create } from "zustand"
import type { Vector3Tuple } from "three"
import useScreenShakeStore from "@/stores/useScreenShakeStore"
import { SHAKE_INTENSITY } from "@/components/screenShake/shakeIntensity"

const BOUNCE_DEBOUNCE_MS = 200

interface MultiballStore {
  bounceCount: number
  cooldownActive: boolean
  registerBounce: (
    ballId: string,
    threshold: number,
    position1: Vector3Tuple,
    position2: Vector3Tuple,
    spawnIntervalMs: number,
    cooldownMs: number,
    ballCount: number,
  ) => void
  reset: () => void
}

const useMultiballStore = create<MultiballStore>()((set, get) => {
  let cooldownTimer: ReturnType<typeof setTimeout> | null = null
  const spawnTimers: ReturnType<typeof setTimeout>[] = []
  const lastBounceTimeByBall = new Map<string, number>()

  return {
    bounceCount: 0,
    cooldownActive: false,

    registerBounce: (
      ballId,
      threshold,
      position1,
      position2,
      spawnIntervalMs,
      cooldownMs,
      ballCount,
    ) => {
      const state = get()
      if (state.cooldownActive) return

      const now = performance.now()
      const lastTime = lastBounceTimeByBall.get(ballId) ?? 0
      if (now - lastTime < BOUNCE_DEBOUNCE_MS) return
      lastBounceTimeByBall.set(ballId, now)

      const nextCount = state.bounceCount + 1

      if (nextCount < threshold) {
        const hitIndex = Math.min(nextCount - 1, 9)
        playSfx(`hit${String(hitIndex)}`)
        useScreenShakeStore.getState().addTrauma(SHAKE_INTENSITY.multiballBounce)
        set({ bounceCount: nextCount })
        return
      }

      playSfx("multiball_triggered")
      useScreenShakeStore.getState().addTrauma(SHAKE_INTENSITY.multiballTrigger)
      set({ bounceCount: 0, cooldownActive: true })

      const spawnBall = useBallStore.getState().spawnBall
      for (let i = 0; i < ballCount; i++) {
        const timer = setTimeout(() => {
          const pos = Math.random() < 0.5 ? position1 : position2
          spawnBall(pos, { isPlaying: true })
        }, i * spawnIntervalMs)
        spawnTimers.push(timer)
      }

      broadcastEvent({ event_type: "multiball_triggered", payload: {} })

      if (cooldownTimer !== null) clearTimeout(cooldownTimer)
      cooldownTimer = setTimeout(() => {
        set({ cooldownActive: false })
        cooldownTimer = null
      }, cooldownMs)
    },

    reset: () => {
      if (cooldownTimer !== null) {
        clearTimeout(cooldownTimer)
        cooldownTimer = null
      }
      for (const t of spawnTimers) clearTimeout(t)
      spawnTimers.length = 0
      lastBounceTimeByBall.clear()
      set({ bounceCount: 0, cooldownActive: false })
    },
  }
})

export default useMultiballStore
