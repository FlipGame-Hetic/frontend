import useBallStore from "@/stores/useBallStore"
import { CuboidCollider, RigidBody, type CuboidArgs } from "@react-three/rapier"
import { useControls } from "leva"
import { useMemo } from "react"
import type { Vector3Tuple } from "three"
import Wall from "./Wall"

interface TableParams {
  playfieldWidth: number
  length: number
  shooterLaneWidth: number
  drainWidth: number
  wallThickness: number
  wallHeight: number
  arcRadius: number
  arcSegments: number
}

const TABLE_DEFAULTS: TableParams = {
  playfieldWidth: 8,
  length: 20,
  shooterLaneWidth: 1,
  drainWidth: 2.5,
  wallThickness: 0.1,
  wallHeight: 0.5,
  arcRadius: 2,
  arcSegments: 6,
}

interface WallConfig {
  args: CuboidArgs
  position: Vector3Tuple
  rotation?: Vector3Tuple
  color?: string
}

function hasBallId(value: unknown): value is { ballId: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "ballId" in value &&
    typeof value.ballId === "string"
  )
}

function computeWalls(t: TableParams): WallConfig[] {
  const halfP = t.playfieldWidth / 2
  const halfL = t.length / 2
  const outerRightX = halfP + t.shooterLaneWidth
  const T = t.wallThickness
  const H = t.wallHeight
  const R = t.arcRadius

  const verticalLen = t.length - R
  const halfVertLen = verticalLen / 2
  const verticalCenterZ = halfL - halfVertLen

  const topWallHalf = (outerRightX - R + halfP) / 2
  const topWallCenterX = (-halfP + outerRightX - R) / 2

  const bottomLeftLen = halfP - t.drainWidth / 2
  const bottomRightLen = halfP - t.drainWidth / 2

  const straight: WallConfig[] = [
    { args: [topWallHalf, H, T], position: [topWallCenterX, H, -halfL] },
    { args: [T, H, halfL], position: [-halfP, H, 0] },
    { args: [T, H, halfVertLen], position: [outerRightX, H, verticalCenterZ] },
    { args: [T, H, halfVertLen], position: [halfP, H, verticalCenterZ] },
    { args: [bottomLeftLen / 2, H, T], position: [-halfP + bottomLeftLen / 2, H, halfL] },
    {
      args: [bottomRightLen / 2, H, T],
      position: [t.drainWidth / 2 + bottomRightLen / 2, H, halfL],
    },
  ]

  const arc: WallConfig[] = []
  const cx = outerRightX - R
  const cz = -halfL + R

  for (let i = 0; i < t.arcSegments; i++) {
    const a1 = (i / t.arcSegments) * (Math.PI / 2)
    const a2 = ((i + 1) / t.arcSegments) * (Math.PI / 2)
    const x1 = cx + R * Math.cos(a1)
    const z1 = cz - R * Math.sin(a1)
    const x2 = cx + R * Math.cos(a2)
    const z2 = cz - R * Math.sin(a2)
    const dx = x2 - x1
    const dz = z2 - z1

    arc.push({
      args: [T, H, Math.sqrt(dx * dx + dz * dz) / 2],
      position: [(x1 + x2) / 2, H, (z1 + z2) / 2],
      rotation: [0, Math.atan2(dx, dz), 0],
    })
  }

  const totalWidth = (t.playfieldWidth + t.shooterLaneWidth) / 2
  const floorCenterX = t.shooterLaneWidth / 2
  const floor: WallConfig = {
    args: [totalWidth, 0.5, halfL],
    position: [floorCenterX, -0.5, 0],
    color: "#cfcfcf",
  }

  return [...straight, ...arc, floor]
}

const Walls = () => {
  const table = useControls("Table", {
    playfieldWidth: {
      value: TABLE_DEFAULTS.playfieldWidth,
      min: 4,
      max: 16,
      label: "Field width",
    },
    length: { value: TABLE_DEFAULTS.length, min: 10, max: 30, label: "Field length" },
    shooterLaneWidth: {
      value: TABLE_DEFAULTS.shooterLaneWidth,
      min: 0.5,
      max: 3,
      label: "Shooter lane width",
    },
    drainWidth: { value: TABLE_DEFAULTS.drainWidth, min: 1, max: 5, label: "Drain width" },
    wallThickness: {
      value: TABLE_DEFAULTS.wallThickness,
      min: 0.05,
      max: 0.5,
      label: "Wall thickness",
    },
    wallHeight: { value: TABLE_DEFAULTS.wallHeight, min: 0.2, max: 2, label: "Wall height" },
    arcRadius: { value: TABLE_DEFAULTS.arcRadius, min: 0.5, max: 5, label: "Arc radius" },
    arcSegments: {
      value: TABLE_DEFAULTS.arcSegments,
      min: 3,
      max: 16,
      step: 1,
      label: "Arc segments",
    },
  })

  const setBallPlaying = useBallStore((state) => state.setBallPlaying)
  const hasPlayingBall = useBallStore((state) => state.playingBallIds.length > 0)

  const walls = useMemo(() => computeWalls(table), [table])

  const drainSensor = useMemo(() => {
    const halfDrain = table.drainWidth / 2
    const halfL = table.length / 2
    return {
      args: [halfDrain, table.wallHeight, table.wallThickness] as CuboidArgs,
      position: [0, table.wallHeight, halfL] as Vector3Tuple,
    }
  }, [table])

  const laneExitSensor = useMemo(() => {
    const halfP = table.playfieldWidth / 2
    const halfL = table.length / 2
    const laneX = halfP + table.shooterLaneWidth / 2
    const laneExitZ = -(halfL - table.arcRadius)
    return {
      args: [table.shooterLaneWidth / 2, table.wallHeight, 0.5] as CuboidArgs,
      position: [laneX, table.wallHeight, laneExitZ] as Vector3Tuple,
    }
  }, [table])

  return (
    <RigidBody type="fixed" colliders={false}>
      {walls.map((wall, i) => (
        <Wall key={i} {...wall} />
      ))}
      <CuboidCollider
        sensor
        name="drain"
        args={drainSensor.args}
        position={drainSensor.position}
        onIntersectionEnter={({ rigidBodyObject }) => {
          if (rigidBodyObject?.name === "ball") {
            if (hasBallId(rigidBodyObject.userData)) {
              setBallPlaying(rigidBodyObject.userData.ballId, false)
            }
          }
        }}
      />
      <CuboidCollider
        sensor
        name="lane-exit"
        args={laneExitSensor.args}
        position={laneExitSensor.position}
        onIntersectionExit={({ rigidBodyObject }) => {
          if (rigidBodyObject?.name === "ball") {
            if (hasBallId(rigidBodyObject.userData)) {
              setBallPlaying(rigidBodyObject.userData.ballId, true)
            }
          }
        }}
      />
      {hasPlayingBall && (
        <CuboidCollider
          name="lane-gate"
          args={laneExitSensor.args}
          position={laneExitSensor.position}
        />
      )}
    </RigidBody>
  )
}

export default Walls
