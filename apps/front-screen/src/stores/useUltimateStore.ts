import { create } from "zustand"
import type {
  CharacterType,
  UltiId,
  UltiPayload,
  UltiShape,
  UltimateStoppedEvent,
  UltimateTriggeredEvent,
} from "@frontend/types"
import {
  DEFAULT_SLOW_FACTOR,
  MULTIBALL_SPLIT_SPAWN_POSITIONS,
  RAMPAGE_TIME_SCALE,
} from "@/components/ultimate/ultimateConfig"
import { playSfx } from "@/audio/soundEngine"
import useBallStore from "./useBallStore"

interface ActiveUltimate {
  ultiId: UltiId
  character: CharacterType
  shape: UltiShape
  cancellable: boolean
  durationMs: number
  startedAt: number
}

interface ChargeUpdate {
  ultimate_charge?: number
  ultimate_max?: number
  ulti_ready?: boolean
  next_ulti_id?: UltiId
}

interface UltimateStore {
  charge: number
  chargeMax: number
  ready: boolean
  nextUltiId: UltiId | null
  active: ActiveUltimate | null
  timeScale: number
  setChargeFromScore: (update: ChargeUpdate) => void
  onTriggered: (payload: UltimateTriggeredEvent["payload"]) => void
  onStopped: (payload: UltimateStoppedEvent["payload"]) => void
  reset: () => void
}

const INITIAL_STATE = {
  charge: 0,
  chargeMax: 0,
  ready: false,
  nextUltiId: null as UltiId | null,
  active: null as ActiveUltimate | null,
  timeScale: 1,
}

const timeScaleFor = (ultiId: UltiId, payload?: UltiPayload): number => {
  if (ultiId === "time_slow") return payload?.slow_factor ?? DEFAULT_SLOW_FACTOR
  if (ultiId === "rampage") return RAMPAGE_TIME_SCALE
  return 1
}

const runMultiballSplit = (): void => {
  const ballStore = useBallStore.getState()
  const currentBallIds = [...ballStore.playingBallIds]

  for (const position of MULTIBALL_SPLIT_SPAWN_POSITIONS) {
    ballStore.spawnBall([...position], { isPlaying: true })
  }

  for (const ballId of currentBallIds) {
    ballStore.deleteBall(ballId)
  }
}

const useUltimateStore = create<UltimateStore>()((set, get) => {
  let endTimer: ReturnType<typeof setTimeout> | null = null

  const clearEndTimer = (): void => {
    if (endTimer !== null) {
      clearTimeout(endTimer)
      endTimer = null
    }
  }

  const endNaturally = (): void => {
    clearEndTimer()
    set({ active: null, timeScale: 1, charge: 0, ready: false })
  }

  return {
    ...INITIAL_STATE,

    setChargeFromScore: ({ ultimate_charge, ultimate_max, ulti_ready, next_ulti_id }) => {
      if (get().active) {
        // While an ultimate is active, early returns to keep the next copied ultimate id and ignore charge updates
        set({ nextUltiId: next_ulti_id ?? null })
        return
      }

      const wasReady = get().ready
      const nextReady = ulti_ready ?? wasReady

      set((state) => ({
        charge: ultimate_charge ?? state.charge,
        chargeMax: ultimate_max ?? state.chargeMax,
        ready: nextReady,
        nextUltiId: next_ulti_id ?? null,
      }))

      if (!wasReady && nextReady) playSfx("ultimate_ready")
    },

    onTriggered: (payload) => {
      playSfx("ultimate_trigger")
      clearEndTimer()

      if (payload.ulti_id === "multiball_split") {
        runMultiballSplit()
      }

      if (payload.shape !== "sustained") {
        set({ active: null, timeScale: 1, charge: 0, ready: false })
        return
      }

      const durationMs = payload.duration_ms ?? 0

      set((state) => ({
        active: {
          ultiId: payload.ulti_id,
          character: payload.character,
          shape: payload.shape,
          cancellable: payload.cancellable,
          durationMs,
          startedAt: performance.now(),
        },
        timeScale: timeScaleFor(payload.ulti_id, payload.payload),
        ready: false,
        charge: state.chargeMax,
      }))

      if (durationMs > 0) {
        endTimer = setTimeout(endNaturally, durationMs)
      }
    },

    onStopped: ({ ultimate_charge }) => {
      clearEndTimer()
      set((state) => ({
        active: null,
        timeScale: 1,
        charge: ultimate_charge,
        ready: ultimate_charge >= state.chargeMax && state.chargeMax > 0,
      }))
    },

    reset: () => {
      clearEndTimer()
      set(INITIAL_STATE)
    },
  }
})

export default useUltimateStore
