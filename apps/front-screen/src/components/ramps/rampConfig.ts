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
  normalEscapeClamp: number
}

export const RAMP_CURVE_TENSION = 0.5

export const RAMP_SENSOR_HEIGHT_PADDING = 0.5
export const RAMP_SENSOR_MIN_HEIGHT_FACTOR = 1.25

export const RAIL_RADIUS = BALL_RADIUS * 0.12
export const RAIL_COLOR = "#c8cbd0"
export const RAIL_METALNESS = 0.95
export const RAIL_ROUGHNESS = 0.25
export const RAIL_TUBULAR_SEGMENTS = 256
export const RAIL_RADIAL_SEGMENTS = 8
export const RAIL_SAMPLE_POINTS = 96

export const RAMP_DEFAULTS: RampSettings = {
  segmentCount: 64,
  channelWidth: BALL_RADIUS * 3.0,
  floorThickness: BALL_RADIUS * 0.45,
  wallThickness: BALL_RADIUS * 0.4,
  wallHeight: BALL_RADIUS * 4.0,
  segmentOverlap: BALL_RADIUS * 0.9,
  surfaceFriction: 0.03,
  surfaceRestitution: 0.03,
  assistAcceleration: 8.5,
  assistMaxSpeed: 18,
  assistMaxT: 0.9,
  assistEntryRetention: 0.9,
  normalEscapeClamp: 3.0,
}

export const LEFT_RAMP_POINTS: RampPathPoints = [
  new THREE.Vector3(2.45, 0.35, 8.2),
  new THREE.Vector3(3.15, 0.45, 3.6),
  new THREE.Vector3(3.55, 0.8, -0.8),
  new THREE.Vector3(3.45, 1.25, -4.4),
  new THREE.Vector3(3.0, 1.8, -6.8),
  new THREE.Vector3(2.1, 2.2, -7.9),
  new THREE.Vector3(0.7, 2.42, -8.3),
  new THREE.Vector3(-1.2, 2.45, -8.45),
  new THREE.Vector3(-2.7, 2.35, -8.35),
  new THREE.Vector3(-3.55, 2.25, -8.2),
]
