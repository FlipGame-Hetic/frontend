import { create } from "zustand"
import type { BallSaverPhase, BallSaverSide } from "@/components/ballSavers/ballSaverConfig"

interface BallSaverPhaseState {
  phases: Record<BallSaverSide, BallSaverPhase>
  cooldownEndsAt: Record<BallSaverSide, number | null>
  setPhase: (side: BallSaverSide, phase: BallSaverPhase) => void
  setCooldownEndsAt: (side: BallSaverSide, endsAt: number | null) => void
}

const INITIAL_BALL_SAVER_PHASES: Record<BallSaverSide, BallSaverPhase> = {
  left: "down",
  right: "down",
}

const INITIAL_COOLDOWN_ENDS_AT: Record<BallSaverSide, number | null> = {
  left: null,
  right: null,
}

const useBallSaverPhaseStore = create<BallSaverPhaseState>()((set) => ({
  phases: INITIAL_BALL_SAVER_PHASES,
  cooldownEndsAt: INITIAL_COOLDOWN_ENDS_AT,
  setPhase: (side, phase) => {
    set((state) => {
      if (state.phases[side] === phase) return state

      return {
        phases: {
          ...state.phases,
          [side]: phase,
        },
      }
    })
  },
  setCooldownEndsAt: (side, endsAt) => {
    set((state) => {
      if (state.cooldownEndsAt[side] === endsAt) return state

      return {
        cooldownEndsAt: {
          ...state.cooldownEndsAt,
          [side]: endsAt,
        },
      }
    })
  },
}))

export { INITIAL_BALL_SAVER_PHASES }
export default useBallSaverPhaseStore
