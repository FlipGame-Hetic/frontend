export const SLINGSHOT_RESTITUTION = 0.8
export const SLINGSHOT_BODY_RESTITUTION = 0.05
export const SLINGSHOT_IMPULSE_STRENGTH = 8

export const SLINGSHOT_TREMBLE_DURATION = 0.3
export const SLINGSHOT_TREMBLE_AMP = 0.05
export const SLINGSHOT_TREMBLE_FREQ = 80

export const SLINGSHOT_STUCK_FRAMES = 30
export const SLINGSHOT_STUCK_VELOCITY = 0.5
export const SLINGSHOT_UNSTICK_IMPULSE = 5

export const SLINGSHOT_FACE_HEIGHT = 0.7
export const SLINGSHOT_FACE_THICKNESS = 0.12
export const SLINGSHOT_FACE_OUTSET = 0.04

export const SLINGSHOT_ACTIVE_FACE_POINTS = {
  left: {
    start: [-0.3, -0.801],
    end: [0.4, 0.62],
    normal: [0.897, -0.442],
  },
  right: {
    start: [0.3, -0.801],
    end: [-0.4, 0.62],
    normal: [-0.897, -0.442],
  },
} as const
