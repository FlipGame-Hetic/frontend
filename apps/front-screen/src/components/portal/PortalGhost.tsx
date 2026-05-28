import { useEffect, useRef } from "react"
import type { Group } from "three"
import { BALL_RADIUS } from "../balls/ballConfig"
import { getPortalFrontFacePosition, oppositePortal } from "./portalConfig"
import { getTraversal, registerGhostRef, unregisterGhostRef } from "./portalTraversalState"

interface PortalGhostProps {
  ballId: string
}

const PortalGhost = ({ ballId }: PortalGhostProps) => {
  const groupRef = useRef<Group>(null)

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
      <mesh>
        <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
        <meshStandardMaterial color="white" transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

export default PortalGhost
