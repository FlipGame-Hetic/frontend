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

// Lumière d'accent colorée (porte les gros virages couleur sur le playfield).
// Volontairement calme pour ne pas inonder la scène et laisser les spots ressortir.
export const ACCENT_BASE_INTENSITY = 0.1
export const ACCENT_SWELL_STRENGTH = 0.8
export const ACCENT_DROP_BOOST = 0.7
export const ACCENT_POSITION: [number, number, number] = [7, 11, 6]

// Spotlights : 2 vraies SpotLight volumétriques (drei), diagonales depuis le haut.
// Intensités élevées car decay physique (three) : éclairement ~ intensity / dist².
export const SPOT_A_POSITION: [number, number, number] = [-9, 14, -3]
export const SPOT_B_POSITION: [number, number, number] = [9, 14, 4]
export const SPOT_BASE_INTENSITY = 350
export const SPOT_SWELL_STRENGTH = 550
export const SPOT_DROP_BOOST = 500
export const SPOT_DECAY = 2
export const SPOT_ANGLE = 0.4
export const SPOT_PENUMBRA = 0.6
export const SPOT_DISTANCE = 45
export const SPOT_ATTENUATION = 18
export const SPOT_ANGLE_POWER = 4
export const SPOT_VOLUMETRIC_OPACITY = 0.6

// Déplacement de la zone éclairée (target). Bornes ~playfield (X≈±3.7, Z≈±8).
export const SPOT_TARGET_MIN: [number, number, number] = [-4.5, 0.4, -8]
export const SPOT_TARGET_MAX: [number, number, number] = [4.5, 1.8, 7]
export const SPOT_DRIFT_SPEED = 0.12 // vitesse de dérive calme
export const SPOT_BURST_SPEED = 1.6 // vitesse pendant un emballement
export const SPOT_BURST_DURATION = 1.4 // durée d'un emballement (s)
export const SPOT_BURST_INTERVAL_MIN = 5 // intervalle mini entre emballements (s)
export const SPOT_BURST_INTERVAL_MAX = 13 // intervalle maxi entre emballements (s)

// Couche god-rays shader (subtile, top/diagonal, par-dessus les vraies lumières).
export const SPOTS_OPACITY = 0.06
