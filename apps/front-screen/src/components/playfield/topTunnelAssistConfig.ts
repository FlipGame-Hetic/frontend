import type { PositionType } from "@/types/worldTypes"

export type TopTunnelAssistSegmentId = "entry-drop" | "top-cross" | "left-return"

export interface TopTunnelEntryTractorConfig {
  halfHeight: number
  radius: number
  position: PositionType
  rotation: PositionType
  pullAccel: number
}

export interface TopTunnelAssistSegmentConfig {
  id: TopTunnelAssistSegmentId
  start: PositionType
  end: PositionType
  sensorHalfExtents: PositionType
  sensorPosition: PositionType
  sensorRotation?: PositionType
  centerPullAccel: number
  forwardAccel: number
}

export interface TopTunnelAssistCornerBlendConfig {
  fromSegmentId: TopTunnelAssistSegmentId
  toSegmentId: TopTunnelAssistSegmentId
  beforeDistance: number
  afterDistance: number
}

export const TOP_TUNNEL_ENTRY_TRACTOR: TopTunnelEntryTractorConfig = {
  halfHeight: 1.5,
  radius: 0.65,
  position: [3, 1.95, -4],
  rotation: [-1.5, -0.7, -0.15],
  pullAccel: 30,
}

export const TOP_TUNNEL_ASSIST_SEGMENTS: TopTunnelAssistSegmentConfig[] = [
  {
    id: "entry-drop",
    start: [3.1, 1.95, -4.2],
    end: [3.1, 2.5, -6.8],
    sensorHalfExtents: [0.25, 1, 1.8],
    sensorPosition: [3.1, 1.95, -5.375],
    centerPullAccel: 20,
    forwardAccel: 50,
  },
  {
    id: "top-cross",
    start: [2.8, 2.5, -6.8],
    end: [-2.65, 2.5, -6.8],
    sensorHalfExtents: [3.65, 0.5, 0.45],
    sensorPosition: [0.075, 2.5, -6.8],
    centerPullAccel: 50,
    forwardAccel: 50,
  },
  {
    id: "left-return",
    start: [-2.65, 1.85, -6.55],
    end: [-3.4, 1.7, -3],
    sensorHalfExtents: [0.2, 1.2, 4],
    sensorPosition: [-3.4, 1.7, -3],
    centerPullAccel: 20,
    forwardAccel: 20,
  },
]

export const TOP_TUNNEL_ASSIST_CORNER_BLENDS: TopTunnelAssistCornerBlendConfig[] = [
  {
    fromSegmentId: "entry-drop",
    toSegmentId: "top-cross",
    beforeDistance: 0.8,
    afterDistance: 0.65,
  },
  {
    fromSegmentId: "top-cross",
    toSegmentId: "left-return",
    beforeDistance: 0.8,
    afterDistance: 0.65,
  },
]

export const TOP_TUNNEL_ASSIST_EXIT_DEBOUNCE_MS = 220
export const TOP_TUNNEL_ASSIST_MAX_FORWARD_SPEED = 12
export const TOP_TUNNEL_ASSIST_MIN_ENTRY_FORWARD_SPEED = -1
export const TOP_TUNNEL_ASSIST_CENTER_DEAD_ZONE = 0.04
export const TOP_TUNNEL_ASSIST_PULL_FULL_DISTANCE = 0.45
