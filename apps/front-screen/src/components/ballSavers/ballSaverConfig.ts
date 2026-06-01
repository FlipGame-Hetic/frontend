import type { PositionType } from "@/types/worldTypes"

export type BallSaverSide = "left" | "right"

export const BALL_SAVER_TARGET_IDS: Record<BallSaverSide, readonly string[]> = {
  left: ["l_target_01", "l_target_02", "l_target_03", "l_target_04"],
  right: ["r_target_01", "r_target_02", "r_target_03"],
}

export const BALL_SAVER_POST_EXIT_DELAY_MS = 250
export const BALL_SAVER_MIN_CONTACT_DURATION_MS = 40
export const BALL_SAVER_COOLDOWN_MS = 5000
export const BALL_SAVER_RAISE_DURATION_MS = 180
export const BALL_SAVER_RETRACT_DURATION_MS = 180
export const BALL_SAVER_VISIBLE_HEIGHT = 0.04
export const BALL_SAVER_MIN_DROP_RATIO = 0.9

export const getBallSaverSideFromWorldPosition = (position: PositionType): BallSaverSide => {
  return position[0] < 0 ? "left" : "right"
}

export const areBallSaverTargetsDown = (
  side: BallSaverSide,
  activatedTargetIds: readonly string[],
): boolean => {
  return BALL_SAVER_TARGET_IDS[side].every((id) => activatedTargetIds.includes(id))
}
