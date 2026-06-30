import type { PositionType } from "@/types/worldTypes"
import {
  TOP_TUNNEL_ASSIST_SEGMENTS,
  TOP_TUNNEL_ENTRY_TRACTOR,
} from "../../topTunnelAssist/topTunnelAssistConfig"

export interface SnapExemptZoneConfig {
  id: string
  position: PositionType
  rotation: PositionType
  halfExtents: PositionType
}

// Inflate the tunnel sensor volumes so snapping is suppressed slightly before the ball reaches the mouth, avoiding a jolt on entry
const TUNNEL_ZONE_INFLATION: PositionType = [0.25, 0.3, 0.15]

const tunnelSegmentZones: SnapExemptZoneConfig[] = TOP_TUNNEL_ASSIST_SEGMENTS.map((segment) => ({
  id: `tunnel-${segment.id}`,
  position: segment.sensorPosition,
  rotation: segment.sensorRotation ?? [0, 0, 0],
  halfExtents: [
    segment.sensorHalfExtents[0] + TUNNEL_ZONE_INFLATION[0],
    segment.sensorHalfExtents[1] + TUNNEL_ZONE_INFLATION[1],
    segment.sensorHalfExtents[2] + TUNNEL_ZONE_INFLATION[2],
  ],
}))

export const SNAP_EXEMPT_ZONES: SnapExemptZoneConfig[] = [
  {
    id: "rail-right-entrance",
    position: [1.3, 1.1, -3.1],
    rotation: [0, 0, 0],
    halfExtents: [0.5, 0.85, 1.3],
  },
  {
    id: "rail-left-entrance",
    position: [-2.0, 1.15, -3.5],
    rotation: [0, 0, 0],
    halfExtents: [0.5, 0.9, 1.3],
  },
  {
    id: "tunnel-entry-tractor",
    position: TOP_TUNNEL_ENTRY_TRACTOR.position,
    rotation: [0, 0, 0],
    halfExtents: [0.8, 1.1, 1.7],
  },
  ...tunnelSegmentZones,
]
