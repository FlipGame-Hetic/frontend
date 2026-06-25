import type { Vector3Tuple } from "three"

export interface ControlHintPlacement {
  position: { browser: Vector3Tuple; cabinet: Vector3Tuple }
  distanceFactor: number
}

export const CONTROL_HINTS_CONFIG = {
  plunger: { position: { browser: [3.2, 1.0, 5.7], cabinet: [3.2, 1.0, 5.2] }, distanceFactor: 3 },
  flipperLeft: { position: { browser: [-1, 1.0, 6], cabinet: [-1, 1.0, 5.7] }, distanceFactor: 3 },
  flipperRight: {
    position: { browser: [0.4, 1.0, 6], cabinet: [0.4, 1.0, 5.7] },
    distanceFactor: 3,
  },
} as const satisfies Record<string, ControlHintPlacement>

export const CONTROL_HINT_LABELS = {
  cabinet: { plunger: ["BOUTON", "PLUNGER"], flipperLeft: ["L1"], flipperRight: ["R1"] },
  browser: { plunger: ["ESPACE"], flipperLeft: ["FL.", "GAUCHE"], flipperRight: ["FL.", "DROITE"] },
} as const
