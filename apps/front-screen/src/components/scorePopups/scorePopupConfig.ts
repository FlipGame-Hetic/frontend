export const SCORE_POPUP_DURATION = 1.2
export const SCORE_POPUP_FADE_IN = 0.15
export const SCORE_POPUP_FADE_OUT_START = 0.85
export const SCORE_POPUP_RISE_HEIGHT = 0.6
export const SCORE_POPUP_Y_OFFSET = 0.4
export const SCORE_POPUP_FONT_SIZE = 0.22
export const SCORE_POPUP_OUTLINE_WIDTH = 0
export const SCORE_POPUP_OUTLINE_COLOR = "#3a1a00"
export const SCORE_POPUP_FONT = "/fonts/orbitron/static/Orbitron-Black.ttf"

export const getScorePopupColor = (amount: number): string => {
  if (amount >= 1000) return "#FFD700"
  if (amount >= 500) return "#FF6600"
  if (amount >= 100) return "#FFA500"
  return "#FFE070"
}
