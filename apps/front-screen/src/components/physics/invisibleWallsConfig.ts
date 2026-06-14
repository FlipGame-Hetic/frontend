import type { PositionType } from "@/types/worldTypes"

export interface InvisibleWallConfig {
  id: string
  halfExtents: PositionType
  position: PositionType
  rotation?: PositionType
  restitution?: number
  friction?: number
}

export const INVISIBLE_WALLS: InvisibleWallConfig[] = [
  {
    id: "ceiling",
    halfExtents: [3.7, 0.05, 8],
    position: [0, 2, 0],
    rotation: [0.25, 0, 0],
    restitution: 0.1,
    friction: 0,
  },
  {
    id: "top-tunnel",
    halfExtents: [0.08, 0.5, 0.4],
    position: [2.79, 2, -4.4],
    rotation: [0.2, -0.2, 0],
    restitution: 0.1,
    friction: 0,
  },
  {
    id: "plunger-lane-ceiling",
    halfExtents: [0.2, 0.05, 3],
    position: [3.25, 0.45, 4],
    rotation: [0.15, 0, 0],
    restitution: 0.1,
    friction: 0,
  },
  {
    id: "rail-right-guard-entrance-left",
    halfExtents: [0.4, 0.23, 0.05],
    position: [1, 1.4, -4],
    rotation: [-0.05, -1.1, 0],
  },
  {
    id: "rail-right-guard-entrance-right",
    halfExtents: [0.2, 0.23, 0.02],
    position: [1.61, 1.4, -4],
    rotation: [-0.05, 1.2, 0],
  },
  {
    id: "rail-right-guard-side",
    halfExtents: [0.6, 0.22, 0.05],
    position: [1.49, 1, -2.92],
    rotation: [-0.05, 1.6, 0],
  },
  {
    id: "rail-right-guard-bottom-1",
    halfExtents: [0.22, 0.224, 0.05],
    position: [1.18, 1, -2.2],
    rotation: [-0.05, -0.7, 0],
  },
  {
    id: "rail-right-guard-bottom-2",
    halfExtents: [0.19, 0.224, 0.05],
    position: [1.4, 1, -2.2],
    rotation: [-0.05, 0.9, 0],
  },
  {
    id: "rail-left-guard-entrance-left",
    halfExtents: [0.2, 0.23, 0.02],
    position: [-2.29, 1.5, -4.3],
    rotation: [-0.05, -1.1, 0],
  },
  {
    id: "rail-left-guard-entrance-right",
    halfExtents: [0.3, 0.23, 0.02],
    position: [-1.75, 1.5, -4.35],
    rotation: [-0.05, 1.3, 0],
  },
  {
    id: "rail-left-guard-side",
    halfExtents: [0.3, 0.33, 0.2],
    position: [-1.86, 0.99, -3.055],
    rotation: [-0.1, 1.7, 0],
  },
  {
    id: "rail-left-guard-bottom",
    halfExtents: [0.3, 0.33, 0.05],
    position: [-1.75, 1, -2.6],
    rotation: [-0.1, -0.6, 0],
  },
  {
    id: "top-tunnel-exit",
    halfExtents: [0.3, 0.2, 0.1],
    position: [-3.4, 1, 1.72],
    rotation: [0, 0, 0],
  },
  {
    id: "top-left-flipper-hole",
    halfExtents: [0.2, 0.2, 0.2],
    position: [-2.7, 0.8, 0.15],
    rotation: [0, 0, 0],
  },
  {
    id: "bottom-left-rail-exit",
    halfExtents: [0.5, 0.1, 0.6],
    position: [-2.6, 0.8, 4],
    rotation: [0.7, 0, 0],
  },
  {
    id: "bottom-right-rail-exit",
    halfExtents: [0.5, 0.1, 0.6],
    position: [2, 0.8, 4],
    rotation: [0.7, 0, 0],
  },
]
