import { Color } from "three"

// Colors and emissive values are pushed past 1 by this factor so the bloom pass treats the VFX as light and makes them glow
export const PLUNGER_VFX_HDR_FACTOR = 3.5

// The energy color ramp, cold at rest, hot when charging, white-hot at full charge
export const PLUNGER_RING_COLOR_COLD = "#00D9E8"
export const PLUNGER_RING_COLOR_HOT = "#FF6600"
export const PLUNGER_RING_COLOR_PEAK = "#FFF4D6"

// Size of the torus ring, radius is the ring itself, tube radius is the thickness of the tube
export const PLUNGER_RING_RADIUS = 0.2
export const PLUNGER_RING_TUBE_RADIUS = 0.022
// Torus geometry resolution, radial segments shape the tube, tubular segments keep the ring outline smooth
export const PLUNGER_RING_RADIAL_SEGMENTS = 12
export const PLUNGER_RING_TUBULAR_SEGMENTS = 48
// Base shader intensity for the main energy rings, tip accents use their own lower intensity
export const PLUNGER_RING_MATERIAL_INTENSITY = 1
// How much each ring shrinks into the next as charge rises, fully charged the 5th ring is about 5 * 0.12 smaller
export const PLUNGER_RING_NEST_FACTOR = 0.12
// At full charge the rings pull together by 90% of their rest spread
export const PLUNGER_RING_CONVERGENCE = 0.9

// Local axis values used to rotate the torus rings and choose a safe perpendicular basis for bob and wobble
export const PLUNGER_RING_LOCAL_FORWARD_AXIS = [0, 0, 1] as const
export const PLUNGER_RING_BASIS_HELPER_AXIS = [1, 0, 0] as const
export const PLUNGER_RING_BASIS_FALLBACK_AXIS = [0, 1, 0] as const
// Dot product above this means the helper axis is too parallel to the travel axis, so the fallback axis is safer
export const PLUNGER_RING_BASIS_PARALLEL_DOT_THRESHOLD = 0.9

// Idle sideways bob, how far the rings drift and how fast, only plays when the plunger is at rest
export const PLUNGER_RING_BOB_AMPLITUDE = 0.035
export const PLUNGER_RING_BOB_SPEED = 1.6
// Secondary bob uses a slower, offset, smaller wave on the second perpendicular axis to make the drift elliptical
export const PLUNGER_RING_SECONDARY_BOB_SPEED_SCALE = 0.8
export const PLUNGER_RING_SECONDARY_BOB_PHASE_SCALE = 1.7
export const PLUNGER_RING_SECONDARY_BOB_AMPLITUDE_SCALE = 0.6
// Idle tilt wobble in radians and its speed
export const PLUNGER_RING_WOBBLE = 0.14
export const PLUNGER_RING_WOBBLE_SPEED = 0.9
// Y-axis wobble runs slightly faster than X so the tilt does not loop as a perfect circle
export const PLUNGER_RING_Y_WOBBLE_SPEED_SCALE = 1.3
// Phase gap between rings so their shaders shimmer out of sync
export const PLUNGER_RING_PHASE_STAGGER = 0.37
// Phase gap between ring transforms so their bob and wobble do not move in lockstep
export const PLUNGER_RING_IDLE_PHASE_STEP = 1.7

// Launch recoil along the axis, a damped sine, amplitude is the first kick, frequency the wobble speed, damping how fast it dies, duration how long it is allowed to run
export const PLUNGER_RING_RECOIL_AMPLITUDE = 0.28
export const PLUNGER_RING_RECOIL_FREQUENCY = 18
export const PLUNGER_RING_RECOIL_DAMPING = 5
export const PLUNGER_RING_RECOIL_DURATION = 1.2
// Recoil taper from back to front, leaving the front ring with half the back ring's kick
export const PLUNGER_RING_RECOIL_TAPER = 0.5
// How fast the launch flash brightness fades back to 0, higher means a shorter flash
export const PLUNGER_RING_FLASH_DECAY = 6
// Flash value applied at launch, treated as full brightness by the shader before the decay starts
export const PLUNGER_RING_FLASH_PEAK = 1

// The launch beam, world units long, lasts 0.3s, thin bright core inside a wider sleeve, pushed forward off the tip by the origin offset
export const PLUNGER_BEAM_LENGTH = 8
export const PLUNGER_BEAM_DURATION = 0.3
export const PLUNGER_BEAM_CORE_RADIUS = 0.05
export const PLUNGER_BEAM_OUTER_RADIUS = 0.16
export const PLUNGER_BEAM_ORIGIN_OFFSET = 0.2

// The launch shockwave ring, lasts 0.4s, grows out to this radius, pushed forward off the tip by the origin offset
export const PLUNGER_SHOCKWAVE_DURATION = 0.4
export const PLUNGER_SHOCKWAVE_MAX_RADIUS = 1.2
export const PLUNGER_SHOCKWAVE_ORIGIN_OFFSET = 0.4

// The three small neon rings around the tip, their offsets along the rod and their size and base glow
export const PLUNGER_TIP_RIM_OFFSETS = [0.12, 0.3, 0.48]
export const PLUNGER_TIP_RIM_RADIUS = 0.13
export const PLUNGER_TIP_RIM_TUBE_RADIUS = 0.012
export const PLUNGER_TIP_RIM_INTENSITY = 0.35

const COLOR_COLD = new Color(PLUNGER_RING_COLOR_COLD)
const COLOR_HOT = new Color(PLUNGER_RING_COLOR_HOT)
const COLOR_PEAK = new Color(PLUNGER_RING_COLOR_PEAK)

// Maps a 0 to 1 charge onto the cold to hot to peak ramp, writing the result into target to avoid allocating a Color every frame
export const getChargeColor = (charge: number, target: Color, hotColor = COLOR_HOT): Color => {
  // Cold to hot over the first 70% of charge
  const heat = Math.min(Math.max(charge / 0.7, 0), 1)
  // Hot to peak white over the last 30%, only the strongest launches reach the peak
  const peak = Math.min(Math.max((charge - 0.7) / 0.3, 0), 1)
  return target.copy(COLOR_COLD).lerp(hotColor, heat).lerp(COLOR_PEAK, peak)
}
