import useBallStore from "@/stores/useBallStore"
import { isPointInPlungerLaneSensor } from "@/components/plunger/plungerConfig"
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

  useFrame(() => {
    const body = ballRef.current
    if (!body) return

    const pos = body.translation()

    if (pos.y <= DRAIN_SAFETY_FALLBACK_Y) {
      deleteBall(id)
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
