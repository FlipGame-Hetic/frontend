import { useFrame } from "@react-three/fiber"
import { useRapier, type RapierCollider } from "@react-three/rapier"
import { useMemo, useRef, useState } from "react"
import type { PositionType } from "@/types/worldTypes"
import { BALL_RADIUS } from "./ballConfig"

interface BallSpawnPreviewProps {
  position: PositionType
  color: string
}

const BALL_SPAWN_PREVIEW_OPACITY = 0.32
const BALL_SPAWN_PREVIEW_COLLISION_COLOR = "#ff3333"
const BALL_SPAWN_PREVIEW_ROTATION = { x: 0, y: 0, z: 0, w: 1 }

const BallSpawnPreview = ({ position, color }: BallSpawnPreviewProps) => {
  const { world, rapier } = useRapier()
  const shape = useMemo(() => new rapier.Ball(BALL_RADIUS), [rapier])
  const [isColliding, setIsColliding] = useState(false)
  const lastCollisionStateRef = useRef(false)

  useFrame(() => {
    let nextIsColliding = false

    world.intersectionsWithShape(
      { x: position[0], y: position[1], z: position[2] },
      BALL_SPAWN_PREVIEW_ROTATION,
      shape,
      () => {
        nextIsColliding = true
        return false
      },
      undefined,
      undefined,
      undefined,
      undefined,
      (collider: RapierCollider) => {
        return !collider.isSensor()
      },
    )

    if (lastCollisionStateRef.current === nextIsColliding) return
    lastCollisionStateRef.current = nextIsColliding
    setIsColliding(nextIsColliding)
  })

  return (
    <mesh position={position} renderOrder={20}>
      <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
      <meshStandardMaterial
        color={isColliding ? BALL_SPAWN_PREVIEW_COLLISION_COLOR : color}
        metalness={0.25}
        roughness={0.2}
        transparent
        opacity={BALL_SPAWN_PREVIEW_OPACITY}
        depthWrite={false}
      />
    </mesh>
  )
}

export default BallSpawnPreview
