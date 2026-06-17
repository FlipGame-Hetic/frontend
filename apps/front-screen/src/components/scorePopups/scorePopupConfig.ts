import { RAJDHANI_BOLD_FONT_URL } from "@frontend/assets/font-urls"

export const SCORE_POPUP_DURATION = 1.2
export const SCORE_POPUP_FADE_IN = 0.15
export const SCORE_POPUP_FADE_OUT_START = 0.85
export const SCORE_POPUP_RISE_HEIGHT = 0.6
export const SCORE_POPUP_Y_OFFSET = 0.4
export const SCORE_POPUP_FONT_SIZE = 0.22
export const SCORE_POPUP_LETTER_SPACING = 0.06
export const SCORE_POPUP_OUTLINE_WIDTH = 0
export const SCORE_POPUP_OUTLINE_COLOR = "#000000"
export const SCORE_POPUP_FONT = RAJDHANI_BOLD_FONT_URL

const SCORE_POPUP_NEGATIVE_COLOR = "#FF3333"
const SCORE_POPUP_COLOR_MAX_AMOUNT = 750
const SCORE_POPUP_MIN_COLOR_OPACITY = 0.34

export const SCORE_POPUP_GLITCH_THRESHOLD = 1000
export const SCORE_POPUP_GLITCH_DURATION = 0.35
export const SCORE_POPUP_GLITCH_SPLIT = 0.032
export const SCORE_POPUP_GLITCH_JITTER = 0.014
export const SCORE_POPUP_GLITCH_STEP_RATE = 34

export const SCORE_POPUP_SHADOW_RED = {
  color: "#C5003C",
  opacity: 0.55,
  offset: [0.018, 0, -0.003] as const,
}

export const SCORE_POPUP_SHADOW_CYAN = {
  color: "#55EAD4",
  opacity: 0.5,
  offset: [-0.018, 0, -0.002] as const,
}

export const SCORE_POPUP_SHADOW_BLACK = {
  color: "#000000",
  opacity: 0.95,
  offset: [0, -0.024, -0.004] as const,
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

export const getScorePopupColor = (amount: number, targetColor: string): string => {
  if (amount < 0) return SCORE_POPUP_NEGATIVE_COLOR

  return targetColor
}

export const getScorePopupFillOpacity = (amount: number): number => {
  if (amount < 0) return 1

  const t = clamp01(amount / SCORE_POPUP_COLOR_MAX_AMOUNT)
  return SCORE_POPUP_MIN_COLOR_OPACITY + (1 - SCORE_POPUP_MIN_COLOR_OPACITY) * t
}
