import { useEffect, useRef } from "react"
import type { Group } from "three"
import { BALL_RADIUS } from "../balls/ballConfig"
import useBallMaterial from "../balls/useBallMaterial"
import { getPortalFrontFacePosition, oppositePortal } from "./portalConfig"
import { getTraversal, registerGhostRef, unregisterGhostRef } from "./portalTraversalState"

interface PortalGhostProps {
  ballId: string
  color?: string
}

const PortalGhost = ({ ballId, color = "#FF8C00" }: PortalGhostProps) => {
  const groupRef = useRef<Group>(null)
  const meshRef = useBallMaterial(color)

  useEffect(() => {
    const group = groupRef.current
    if (group) registerGhostRef(ballId, group)
    return () => {
      unregisterGhostRef(ballId)
    }
  }, [ballId])

  const traversal = getTraversal(ballId)
  const exitPortal = traversal ? oppositePortal(traversal.fromPortal) : "B"
  const initialPos = getPortalFrontFacePosition(exitPortal)

  return (
    <group ref={groupRef} position={initialPos}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
      </mesh>
    </group>
  )
}

export default PortalGhost
