export const BASELINE_RATE = 0.5
export const PEAK_DECAY = 0.25

export const BEAT_FAST_K = 20
export const BEAT_SLOW_K = 3.5
export const BEAT_SENSITIVITY = 4.0
export const BEAT_DECAY_K = 12

export const BAND_ATTACK = 18
export const BAND_DECAY = 6

export const ENERGY_K = 5
export const SWELL_ATTACK = 2.5
export const SWELL_DECAY = 0.65

export const HUE_SPEED = 0.012
export const HUE_ENERGY_BOOST = 0.04

export const NEON_PALETTE_A = [0.5, 0.5, 0.75] as const
export const NEON_PALETTE_B = [0.4, 0.35, 0.25] as const
export const NEON_PALETTE_C = [1.0, 0.95, 0.9] as const
export const NEON_PALETTE_D = [0.5, 0.2, 0.0] as const

// Ambient : wash global modéré (le relief du flipper ne doit pas être aplati).
export const AMBIENT_BASE_INTENSITY = 0.5
export const AMBIENT_SWELL_STRENGTH = 0.28
export const AMBIENT_BEAT_BOOST = 0.12
export const AMBIENT_COLOR_BLEND = 0.18

// Segments scriptés (macro) blendés avec la FFT live (micro).
export const SEG_BASE = 0.55 // part garantie de l'intensité segment
export const SEG_FFT_MIX = 0.45 // part ajoutée par le swell FFT live
export const SEG_INTENSITY_ATTACK = 7 // montée vers la cible (modulée par l'intensité visée)
export const SEG_INTENSITY_DECAY = 1.4 // descente douce vers les passages calmes
export const SEG_COLOR_LERP = 2.5 // transition couleur normale
export const SEG_COLOR_LERP_FAST = 11 // transition couleur snappy (drops / mini-segments)
export const SEG_DROP_PULSE_DECAY = 3.5
