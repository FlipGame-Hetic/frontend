import useBallStore from "@/stores/useBallStore"
import type { PositionType } from "@/types/worldTypes"
import { useFrame } from "@react-three/fiber"
import type { RapierRigidBody } from "@react-three/rapier"
import { RigidBody } from "@react-three/rapier"
import { useRef } from "react"
import { REAL_GRAVITY_Y } from "../physics/physicsConfig"
import { BALL_MASS, BALL_MAX_SPEED, BALL_RADIUS, BALL_RESTITUTION } from "./ballConfig"

interface BallProps {
  id: string
  position: PositionType
  radius?: number
}

const Ball = ({ id, position, radius = BALL_RADIUS }: BallProps) => {
  const { deleteBall } = useBallStore()
  const isPlaying = useBallStore((state) => state.playingBallIds.includes(id))
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

    if (!isPlaying) return

    const vel = body.linvel()
    const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z)
    if (speed > BALL_MAX_SPEED) {
      const ratio = BALL_MAX_SPEED / speed
      body.setLinvel({ x: vel.x * ratio, y: vel.y * ratio, z: vel.z * ratio }, true)
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
      userData={{ ballId: id }}
      mass={BALL_MASS}
      restitution={BALL_RESTITUTION}
    >
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </RigidBody>
  )
}

export default Ball
