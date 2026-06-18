import { Color } from "three"

export const PLUNGER_VFX_HDR_FACTOR = 3.5

export const PLUNGER_RING_COLOR_COLD = "#00D9E8"
export const PLUNGER_RING_COLOR_HOT = "#FF6600"
export const PLUNGER_RING_COLOR_PEAK = "#FFF4D6"

export const PLUNGER_RING_RADIUS = 0.2
export const PLUNGER_RING_TUBE_RADIUS = 0.022
export const PLUNGER_RING_NEST_FACTOR = 0.12
export const PLUNGER_RING_CONVERGENCE = 0.9

export const PLUNGER_RING_BOB_AMPLITUDE = 0.035
export const PLUNGER_RING_BOB_SPEED = 1.6
export const PLUNGER_RING_WOBBLE = 0.14
export const PLUNGER_RING_WOBBLE_SPEED = 0.9

export const PLUNGER_RING_RECOIL_AMPLITUDE = 0.28
export const PLUNGER_RING_RECOIL_FREQUENCY = 18
export const PLUNGER_RING_RECOIL_DAMPING = 5
export const PLUNGER_RING_RECOIL_DURATION = 1.2
export const PLUNGER_RING_FLASH_DECAY = 6

export const PLUNGER_BEAM_LENGTH = 8
export const PLUNGER_BEAM_DURATION = 0.3
export const PLUNGER_BEAM_CORE_RADIUS = 0.05
export const PLUNGER_BEAM_OUTER_RADIUS = 0.16
export const PLUNGER_BEAM_ORIGIN_OFFSET = 0.2

export const PLUNGER_SHOCKWAVE_DURATION = 0.4
export const PLUNGER_SHOCKWAVE_MAX_RADIUS = 1.2
export const PLUNGER_SHOCKWAVE_ORIGIN_OFFSET = 0.4

export const PLUNGER_TIP_RIM_OFFSETS = [0.12, 0.3, 0.48]
export const PLUNGER_TIP_RIM_RADIUS = 0.13
export const PLUNGER_TIP_RIM_TUBE_RADIUS = 0.012
export const PLUNGER_TIP_RIM_INTENSITY = 0.35

const COLOR_COLD = new Color(PLUNGER_RING_COLOR_COLD)
const COLOR_HOT = new Color(PLUNGER_RING_COLOR_HOT)
const COLOR_PEAK = new Color(PLUNGER_RING_COLOR_PEAK)

export const getChargeColor = (charge: number, target: Color, hotColor = COLOR_HOT): Color => {
  const heat = Math.min(Math.max(charge / 0.7, 0), 1)
  const peak = Math.min(Math.max((charge - 0.7) / 0.3, 0), 1)
  return target.copy(COLOR_COLD).lerp(hotColor, heat).lerp(COLOR_PEAK, peak)
}
