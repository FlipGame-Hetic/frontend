import * as THREE from "three"
import { BALL_RADIUS } from "../balls/ballConfig"

export type RampPathPoints = [THREE.Vector3, THREE.Vector3, ...THREE.Vector3[]]

export interface RampSettings {
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

export const RAMP_OPACITY = 0.35
export const RAMP_COLOR = "#88ccff"

export const RAMP_FLOOR_ROUGHNESS = 0.15
export const RAMP_FLOOR_METALNESS = 0.1
export const RAMP_WALL_ROUGHNESS = 0.2
export const RAMP_WALL_METALNESS = 0.05

export const RAMP_CURVE_TENSION = 0.5

export const RAMP_SENSOR_HEIGHT_PADDING = 0.5
export const RAMP_SENSOR_MIN_HEIGHT_FACTOR = 1.25

export const RAMP_DEFAULTS: RampSettings = {
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
