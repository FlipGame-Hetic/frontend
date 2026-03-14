import { RigidBody, type CuboidArgs } from "@react-three/rapier"
import type { Vector3Tuple } from "three"
import Wall from "./Wall"

const TABLE = {
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
}

const halfP = TABLE.playfieldWidth / 2
const halfL = TABLE.length / 2
const outerRightX = halfP + TABLE.shooterLaneWidth
const T = TABLE.wallThickness
const H = TABLE.wallHeight
const R = TABLE.arcRadius

const verticalLen = TABLE.length - R
const halfVertLen = verticalLen / 2
const verticalCenterZ = halfL - halfVertLen

const topWallHalf = (outerRightX - R + halfP) / 2
const topWallCenterX = (-halfP + outerRightX - R) / 2

const bottomLeftLen = halfP - TABLE.drainWidth / 2
const bottomRightLen = halfP - TABLE.drainWidth / 2

const STRAIGHT_WALLS: WallConfig[] = [
  { args: [topWallHalf, H, T], position: [topWallCenterX, H, -halfL] },
  { args: [T, H, halfL], position: [-halfP, H, 0] },
  { args: [T, H, halfVertLen], position: [outerRightX, H, verticalCenterZ] },
  { args: [T, H, halfVertLen], position: [halfP, H, verticalCenterZ] },
  { args: [bottomLeftLen / 2, H, T], position: [-halfP + bottomLeftLen / 2, H, halfL] },
  {
    args: [bottomRightLen / 2, H, T],
    position: [TABLE.drainWidth / 2 + bottomRightLen / 2, H, halfL],
  },
]

const generateArcWalls = (): WallConfig[] => {
  const cx = outerRightX - R
  const cz = -halfL + R
  const walls: WallConfig[] = []

  for (let i = 0; i < TABLE.arcSegments; i++) {
    const a1 = (i / TABLE.arcSegments) * (Math.PI / 2)
    const a2 = ((i + 1) / TABLE.arcSegments) * (Math.PI / 2)
    const x1 = cx + R * Math.cos(a1)
    const z1 = cz - R * Math.sin(a1)
    const x2 = cx + R * Math.cos(a2)
    const z2 = cz - R * Math.sin(a2)
    const dx = x2 - x1
    const dz = z2 - z1

    walls.push({
      args: [T, H, Math.sqrt(dx * dx + dz * dz) / 2],
      position: [(x1 + x2) / 2, H, (z1 + z2) / 2],
      rotation: [0, Math.atan2(dx, dz), 0],
    })
  }

  return walls
}

const WALLS: WallConfig[] = [...STRAIGHT_WALLS, ...generateArcWalls()]

const Walls = () => (
  <RigidBody type="fixed" colliders={false}>
    {WALLS.map((wall, i) => (
      <Wall key={i} {...wall} />
    ))}
  </RigidBody>
)

export default Walls
