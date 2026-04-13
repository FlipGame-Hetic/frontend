import * as THREE from "three"
import { BALL_RADIUS } from "../balls/ballConfig"
import { REAL_GRAVITY_Y } from "../physics/physicsConfig"

export { REAL_GRAVITY_Y }

export type RampPathPoints = [THREE.Vector3, THREE.Vector3, ...THREE.Vector3[]]
export type RampPhysicsMode = "rail" | "native"

export interface NativeRampSettings {
  segmentCount: number
  channelWidth: number
  floorThickness: number
  wallThickness: number
  wallHeight: number
  segmentOverlap: number
  surfaceFriction: number
  surfaceRestitution: number
  assistAcceleration: number
  assistMaxSpeed: number
  assistMaxT: number
  assistEntryRetention: number
}

export const RAMP_CHANNEL_RADIUS = BALL_RADIUS * 1.8
export const RAMP_TUBE_SEGMENTS = 60
export const RAMP_RADIAL_SEGMENTS = 12

export const RAMP_OPACITY = 0.35
export const RAMP_COLOR = "#88ccff"

export const RAMP_MIN_ENTRY_SPEED = 7
export const RAMP_MIN_DIRECTION_ALIGNMENT = 0.82

export const RAMP_ENTRY_CAPTURE_LATERAL = BALL_RADIUS * 2.8
export const RAMP_ENTRY_CAPTURE_FORWARD = BALL_RADIUS * 5
export const RAMP_ENTRY_CAPTURE_BACKWARD = BALL_RADIUS * 7
export const RAMP_ENTRY_CAPTURE_MAX_T = 0.1
export const RAMP_SENSOR_OFFSET = BALL_RADIUS * 1.0

export const RAMP_SENSOR_ARGS: [number, number, number] = [0.5, 0.45, 1.1]

export const NATIVE_RAMP_DEFAULTS: NativeRampSettings = {
  segmentCount: 64,
  channelWidth: BALL_RADIUS * 3.0,
  floorThickness: BALL_RADIUS * 0.45,
  wallThickness: BALL_RADIUS * 0.4,
  wallHeight: BALL_RADIUS * 2.4,
  segmentOverlap: BALL_RADIUS * 0.9,
  surfaceFriction: 0.03,
  surfaceRestitution: 0.03,
  assistAcceleration: 8.5,
  assistMaxSpeed: 18,
  assistMaxT: 0.58,
  assistEntryRetention: 0.9,
}

export const LEFT_RAMP_POINTS: RampPathPoints = [
  new THREE.Vector3(-2.8, 0.5, 5.5),
  new THREE.Vector3(-3.4, 1.2, 4.0),
  new THREE.Vector3(-3.6, 2.8, 1.5),
  new THREE.Vector3(-3.2, 4.0, -2.0),
  new THREE.Vector3(-2.2, 3.0, -5.0),
  new THREE.Vector3(-1.5, 0.5, -7.0),
]

export const RIGHT_RAMP_POINTS: RampPathPoints = [
  new THREE.Vector3(2.8, 0.5, 5.5),
  new THREE.Vector3(3.4, 1.2, 4.0),
  new THREE.Vector3(3.6, 2.8, 1.5),
  new THREE.Vector3(3.2, 4.0, -2.0),
  new THREE.Vector3(2.2, 3.0, -5.0),
  new THREE.Vector3(1.5, 0.5, -7.0),
]
