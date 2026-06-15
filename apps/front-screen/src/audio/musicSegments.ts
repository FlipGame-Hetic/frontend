import { GENERATED_TRACK_SEGMENTS } from "./musicSegments.generated"

export type SegmentType = "calm" | "build" | "drop"

interface MusicSegment {
  time: number
  intensity: number
  color: string
  type: SegmentType
}

export interface TrackSegments {
  duration: number
  segments: MusicSegment[]
}

export const getTrackSegments = (index: number): TrackSegments | null =>
  GENERATED_TRACK_SEGMENTS[index] ?? null
