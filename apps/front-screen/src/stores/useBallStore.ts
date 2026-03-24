import type { BallState } from "@/types/ballTypes"
import type { PositionType } from "@/types/worldTypes"
import { create } from "zustand"

interface ballStore {
  balls: BallState[]
  spawnBall: (position: PositionType) => void
  deleteBall: (id: string) => void
}
const useBallStore = create<ballStore>((set) => ({
  balls: [],
  spawnBall: (position) => {
    set((state) => ({ balls: [...state.balls, { id: crypto.randomUUID(), position }] }))
  },
  deleteBall: (id) => {
    set((state) => ({ balls: state.balls.filter((ball) => ball.id !== id) }))
  },
}))

export default useBallStore
