import type { PositionType } from "@/types/worldTypes"

export type BallSaverSide = "left" | "right"
export type BallSaverPhase = "down" | "rising" | "active" | "retracting" | "cooldown"

interface BallSaverStatusTextConfig {
  position: PositionType
  fontSize: number
  letterSpacing: number
  distanceFactor: number
  renderOrder: number
  color: string
  flickerMinDelayMs: number
  flickerMaxDelayMs: number
  flickerMinDurationMs: number
  flickerMaxDurationMs: number
  flickerMinGapMs: number
  flickerMaxGapMs: number
}

export const BALL_SAVER_TARGET_IDS: Record<BallSaverSide, readonly string[]> = {
  left: ["l_target_01", "l_target_02", "l_target_03", "l_target_04"],
  right: ["r_target_01", "r_target_02", "r_target_03"],
}

export const BALL_SAVER_READY_TEXT = "BALL SAVER"

export const BALL_SAVER_STATUS_TEXT_CONFIG = {
  left: {
    position: [-2.9, 1.18, 0.8],
    fontSize: 50,
    letterSpacing: 0.08,
    distanceFactor: 4.2,
    renderOrder: 900,
    color: "#a81459",
    flickerMinDelayMs: 1200,
    flickerMaxDelayMs: 5200,
    flickerMinDurationMs: 24,
    flickerMaxDurationMs: 86,
    flickerMinGapMs: 42,
    flickerMaxGapMs: 155,
  },
  right: {
    position: [2.4, 1.18, 1.15],
    fontSize: 50,
    letterSpacing: 0.08,
    distanceFactor: 4.2,
    renderOrder: 900,
    color: "#a81459",
    flickerMinDelayMs: 1200,
    flickerMaxDelayMs: 5200,
    flickerMinDurationMs: 24,
    flickerMaxDurationMs: 86,
    flickerMinGapMs: 42,
    flickerMaxGapMs: 155,
  },
} as const satisfies Record<BallSaverSide, BallSaverStatusTextConfig>

// Holographic look for the raised saver mesh : white rim, pink scrolling scan lines, semi-opaque volume
export const BALL_SAVER_HOLO_FILL_COLOR = "#a81459"
export const BALL_SAVER_HOLO_RIM_COLOR = "#ffffff"
// Pushes rim and fill past 1.0 so the global bloom (luminanceThreshold 1.0) lights them up, kept low so faces don't wash out
export const BALL_SAVER_HOLO_HDR_FACTOR = 1.5
// Alpha at the center of the volume, the fresnel rim ramps it up toward 1 on the edges
export const BALL_SAVER_HOLO_BASE_ALPHA = 0.55
// How many scan lines per world unit on Y
export const BALL_SAVER_HOLO_LINE_DENSITY = 45
// World units per second the scan lines scroll upward
export const BALL_SAVER_HOLO_SCROLL_SPEED = 0.6
// How strongly the white fresnel edge is added on top of the pink fill
export const BALL_SAVER_HOLO_RIM_STRENGTH = 0.5

export const BALL_SAVER_POST_EXIT_DELAY_MS = 250
export const BALL_SAVER_MIN_CONTACT_DURATION_MS = 40
export const BALL_SAVER_COOLDOWN_MS = 5000
export const BALL_SAVER_RAISE_DURATION_MS = 180
export const BALL_SAVER_RETRACT_DURATION_MS = 180
export const BALL_SAVER_VISIBLE_HEIGHT = 0.02
export const BALL_SAVER_MIN_DROP_RATIO = 0.9

export const BALL_SAVER_COOLDOWN_RING_RADIUS = 30
export const BALL_SAVER_COOLDOWN_RING_STROKE_WIDTH = 5
// Circle used as the SVG ring's dash length so strokeDashoffset can animate the cooldown sweep
export const BALL_SAVER_COOLDOWN_RING_CIRCUMFERENCE = 2 * Math.PI * BALL_SAVER_COOLDOWN_RING_RADIUS

export const getBallSaverSideFromWorldPosition = (position: PositionType): BallSaverSide => {
  return position[0] < 0 ? "left" : "right"
}

export const areBallSaverTargetsDown = (
  side: BallSaverSide,
  activatedTargetIds: readonly string[],
): boolean => {
  return BALL_SAVER_TARGET_IDS[side].every((id) => activatedTargetIds.includes(id))
}

export const getBallSaverTargetsRemaining = (
  side: BallSaverSide,
  activatedTargetIds: readonly string[],
): number => {
  const targetIds = BALL_SAVER_TARGET_IDS[side]
  const activatedCount = targetIds.filter((id) => activatedTargetIds.includes(id)).length

  return Math.max(0, targetIds.length - activatedCount)
}

export const getBallSaverStatusText = (
  side: BallSaverSide,
  activatedTargetIds: readonly string[],
  phase: BallSaverPhase,
): string | null => {
  if (phase === "retracting" || phase === "cooldown") return null

  const remaining = getBallSaverTargetsRemaining(side, activatedTargetIds)

  return remaining === 0 ? BALL_SAVER_READY_TEXT : String(remaining)
}
