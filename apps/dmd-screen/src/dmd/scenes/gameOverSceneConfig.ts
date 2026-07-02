/**
 * Layout + motion constants for the "Slam & Flatline" game-over scene: a big red
 * two-line GAME / OVER that slams in over a red flash, a flatline EKG accent that
 * fires one last heartbeat then goes flat, and the final score rolling up in the
 * hero-score font (a bit smaller than the in-game version), red-tinted.
 */

// Title — "GAME" over "OVER", big and red.
export const TITLE_SCALE = 3
export const TITLE_SPACING = 1
export const GAME_Y = 4
export const OVER_Y = GAME_Y + 7 * TITLE_SCALE + 1 // = 26
export const TITLE_SLAM_RISE = 10 // px the title drops from as it slams into place
export const TITLE_SHAKE = 2 // max jitter (px) during the impact
export const TITLE_SHAKE_END = 0.45 // intro progress at which the shake has died
export const TITLE_PULSE_MS = 1400 // slow ominous breathing once settled

// Periodic glitch flicker on the settled title (chromatic split).
export const GLITCH_PERIOD_MS = 2400
export const GLITCH_DURATION_MS = 150
export const GLITCH_OFFSET = 2

// Flatline EKG accent between the title and the score.
export const FLATLINE_Y = 53
export const FLATLINE_MARGIN = 10 // px inset from each edge
export const FLATLINE_BASE = 0.32
export const FLATLINE_FLICKER_MS = 220 // faint dead-signal shimmer on the baseline
export const BEAT_AMP = 6 // px height of the final heartbeat spike at intro start
export const BEAT_END = 0.6 // intro progress at which the beat has flattened out

// Final score — same hero font as the score scene, capped a step smaller.
export const SCORE_SCALE_MAX = 2
export const SCORE_Y = 57
export const SCORE_MAX_WIDTH = 118

// Intro: slam + score roll-up duration.
export const INTRO_MS = 900

// Opening red screen-flash.
export const FLASH_FRACTION = 0.18 // fraction of the intro the flash lasts
export const FLASH_BRIGHT = 0.9
