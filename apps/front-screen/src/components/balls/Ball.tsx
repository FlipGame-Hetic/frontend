import useBallStore from "@/stores/useBallStore"
import useGameStore from "@/stores/useGameStore"
import { broadcastEvent } from "@frontend/ws"
import type { PositionType } from "@/types/worldTypes"
import { useFrame } from "@react-three/fiber"
import type { RapierRigidBody } from "@react-three/rapier"
import { RigidBody } from "@react-three/rapier"
import { useRef } from "react"
import { DRAIN_SAFETY_FALLBACK_Y } from "../drain/drainConfig"
import { clampVelocityToPlayfield } from "../physics/playfieldPlane"
import { BALL_RADIUS } from "./ballConfig"

interface BallProps {
  id: string
  position: PositionType
  radius?: number
  mass: number
  restitution: number
  friction: number
  linearDamping: number
  angularDamping: number
  maxTangentSpeed: number
  laneMaxTangentSpeed: number
  minNormalSpeed: number
  maxNormalSpeed: number
}

const Ball = ({
  id,
  position,
  radius = BALL_RADIUS,
  mass,
  restitution,
  friction,
  linearDamping,
  angularDamping,
  maxTangentSpeed,
  laneMaxTangentSpeed,
  minNormalSpeed,
  maxNormalSpeed,
}: BallProps) => {
  const { deleteBall } = useBallStore()
  const ballRef = useRef<RapierRigidBody>(null)
  const groundThreshold = radius + 0.1

  useFrame(() => {
    const body = ballRef.current
    if (!body) return

    const pos = body.translation()

    if (pos.y <= -2) {
      const { ballNumber, currentPlayer, nextBall } = useGameStore.getState()
      broadcastEvent({
        event_type: "ball_lost",
        payload: { ball: ballNumber, player: currentPlayer },
      })
      deleteBall(id)
      nextBall()
      return
    }

    const inLane = isPointInPlungerLaneSensor(pos)
    const vel = body.linvel()
    const clampedVelocity = clampVelocityToPlayfield(
      vel,
      inLane ? laneMaxTangentSpeed : maxTangentSpeed,
      minNormalSpeed,
      maxNormalSpeed,
    )
    body.setLinvel(clampedVelocity, true)
  })

  return (
    <RigidBody
      ref={ballRef}
      type="dynamic"
      position={position}
      colliders="ball"
      ccd
      name="ball"
      userData={{ ballId: id }}
      mass={mass}
      restitution={restitution}
      friction={friction}
      linearDamping={linearDamping}
      angularDamping={angularDamping}
    >
      <mesh castShadow>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </RigidBody>
  )
}

export default Ball
