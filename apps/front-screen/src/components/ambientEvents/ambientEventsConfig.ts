export type AmbientEventType = "holocron" | "car"

export type AmbientEventId = "flyingCar1" | "flyingCar2" | "flyingCube"

export type Waypoint = readonly [number, number, number]

export interface AmbientEventDef {
  type: AmbientEventType
  modelUrl: string
  scale: number
  routes: Record<string, readonly Waypoint[]>
  travelDurationMs: number
  spinSpeed?: number
  modelRotationY?: number
}

export interface AmbientEventInstance {
  id: AmbientEventId
  def: AmbientEventDef
  waypoints: Waypoint[]
}

export interface AmbientEventAtomProps {
  instance: AmbientEventInstance
  onComplete: () => void
}

// Public-folder paths (kept side-effect-free so the scheduler stays testable). The actual preload lives in ambientEventModels.ts
export const AMBIENT_MODEL_URLS = {
  flyingCar1: "/models/randomEvents/flyingCar1.glb",
  flyingCar2: "/models/randomEvents/flyingCar2.glb",
  flyingCube: "/models/randomEvents/flyingCube.glb",
} as const

// Rare on purpose : ~1-2 apparitions on a long game. Next delay = base + random part
export const AMBIENT_EVENT_BASE_DELAY_MS = 20_000
export const AMBIENT_EVENT_DELAY_JITTER_MS = 40_000

// Lane depth wobble, applied on Z only so props never clip the playfield (Y) nor spawn on screen / leave early (X)
export const AMBIENT_EVENT_Z_JITTER = 3

// Straight lanes just above the ceiling (Y=2), travelling along X from off-screen to off-screen over the play area. Shared by both cars
const CAR_ROUTES: Record<string, readonly Waypoint[]> = {
  leftToRight: [
    [-9, 3, 0],
    [9, 3, 0],
  ],
  rightToLeft: [
    [9, 3.3, -2],
    [-9, 3.3, -2],
  ],
  leftToRightHigh: [
    [-9, 3.8, 2],
    [9, 3.8, 2],
  ],
}

// Multi-waypoint strolls : the cube drifts between a couple of spots above the board then exits off-screen
const CUBE_ROUTES: Record<string, readonly Waypoint[]> = {
  driftAcross: [
    [-7, 3, -1],
    [-2, 3.4, 0],
    [3, 3, -1],
    [8, 3.6, -2],
  ],
  driftBack: [
    [6, 2.9, 1],
    [2, 3.3, 0],
    [-3, 3.7, -1],
    [-8, 4, -2],
  ],
}

export const AMBIENT_EVENTS: Record<AmbientEventId, AmbientEventDef> = {
  flyingCar1: {
    type: "car",
    modelUrl: AMBIENT_MODEL_URLS.flyingCar1,
    scale: 0.2,
    routes: CAR_ROUTES,
    travelDurationMs: 6000,
    modelRotationY: 0,
  },
  flyingCar2: {
    type: "car",
    modelUrl: AMBIENT_MODEL_URLS.flyingCar2,
    scale: 0.1,
    routes: CAR_ROUTES,
    travelDurationMs: 6000,
    modelRotationY: Math.PI / 2,
  },
  flyingCube: {
    type: "holocron",
    modelUrl: AMBIENT_MODEL_URLS.flyingCube,
    scale: 3,
    routes: CUBE_ROUTES,
    travelDurationMs: 10_000,
    spinSpeed: 0.8,
  },
}

export const AMBIENT_EVENT_IDS = Object.keys(AMBIENT_EVENTS) as AmbientEventId[]
