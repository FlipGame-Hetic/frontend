import { useFrame } from "@react-three/fiber"
import { useRapier, type RapierCollider } from "@react-three/rapier"
import { useMemo, useRef, useState } from "react"
import type { PositionType } from "@/types/worldTypes"
import {
  BALL_RADIUS,
  BALL_SPAWN_PREVIEW_COLLISION_COLOR,
  BALL_SPAWN_PREVIEW_OPACITY,
  BALL_SPAWN_PREVIEW_ROTATION,
} from "../ballConfig"

interface BallSpawnPreviewProps {
  position: PositionType
  color: string
}

const BallSpawnPreview = ({ position, color }: BallSpawnPreviewProps) => {
  const { world, rapier } = useRapier()
  const shape = useMemo(() => new rapier.Ball(BALL_RADIUS), [rapier])
  const [isColliding, setIsColliding] = useState(false)
  const lastCollisionStateRef = useRef(false)

  useFrame(() => {
    let nextIsColliding = false

    world.intersectionsWithShape(
      // shapePos
      { x: position[0], y: position[1], z: position[2] },
      // shapeRot
      BALL_SPAWN_PREVIEW_ROTATION,
      // shape
      shape,
      // callback
      () => {
        nextIsColliding = true
        return false
      },
      // filterFlags
      undefined,
      // filterGroups
      undefined,
      // filterExcludeCollider
      undefined,
      // filterExcludeRigidBody
      undefined,
      // filterPredicate
      (collider: RapierCollider) => {
        return !collider.isSensor()
      },
    )

    // Only re-render when the overlap state actually flips, not every frame
    if (lastCollisionStateRef.current === nextIsColliding) return

    lastCollisionStateRef.current = nextIsColliding
    setIsColliding(nextIsColliding)
  })

  return (
    <mesh position={position} renderOrder={20}>
      <sphereGeometry args={[BALL_RADIUS, 24, 24]} />
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
