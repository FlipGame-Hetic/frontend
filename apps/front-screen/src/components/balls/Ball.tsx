import useBallStore from "@/stores/useBallStore"
import type { PositionType } from "@/types/worldTypes"
import { useFrame } from "@react-three/fiber"
import type { RapierRigidBody } from "@react-three/rapier"
import { RigidBody } from "@react-three/rapier"
import { useRef } from "react"
import { BALL_MASS } from "../balls/BallConfig"
import { REAL_GRAVITY_Y } from "../physics/physicsConfig"

interface BallProps {
  id: string
  position: PositionType
  radius?: number
}

const Ball = ({ id, position, radius = 0.3 }: BallProps) => {
  const { deleteBall } = useBallStore()
  const ballRef = useRef<RapierRigidBody>(null)
  const groundThreshold = radius + 0.1

  useFrame(() => {
    const body = ballRef.current
    if (!body) return

    const pos = body.translation()

    if (pos.y <= -2) {
      deleteBall(id)
      return
    }

    const isAirborne = pos.y > groundThreshold

    if (isAirborne) {
      body.setGravityScale(0, true)
      const mass = body.mass()
      body.addForce({ x: 0, y: REAL_GRAVITY_Y * mass, z: 0 }, true)
    } else {
      body.setGravityScale(1, true)
    }
  })

  return (
    <RigidBody
      ref={ballRef}
      type="dynamic"
      position={position}
      colliders="ball"
      gravityScale={0}
      ccd
      name="ball"
      mass={BALL_MASS}
    >
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </RigidBody>
  )
}

export default Ball
