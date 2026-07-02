/** Layout and motion constants for the cyberpunk attract (idle) scene. */

// Glitch title — the logo. 12 chars ("S.P.A.M.E.R.") at scale 2 needs spacing 0 to
// fit the 128px width (12 * 5 * 2 = 120px, leaving a 4px margin each side).
export const TITLE = "S.P.A.M.E.R."
export const TITLE_Y = 22
export const TITLE_SCALE = 2
export const TITLE_SPACING = 0
export const GLITCH_PERIOD_MS = 2600
export const GLITCH_DURATION_MS = 160
export const GLITCH_STEP_MS = 40
export const GLITCH_OFFSET = 2

// Electric-blue base with a quick acid-yellow double-flash each cycle (CP2077 neon flicker)
export const FLASH_PERIOD_MS = 1600
export const FLASH_ON_MS = 70
export const FLASH_GAP_MS = 160

// Blinking credit prompt — classic pinball UI, kept old-school orange
export const PROMPT = "INSÉRER CRÉDIT"
export const PROMPT_Y = 54
export const PROMPT_BLINK_MS = 550
export const PROMPT_BRIGHT = 1.0

// Corner brackets — ambient glow
export const BRACKET_BASE = 0.18
export const BRACKET_SWING = 0.16
export const BRACKET_GLOW_MS = 2200
