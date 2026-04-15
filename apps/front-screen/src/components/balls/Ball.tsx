import useBallStore from "@/stores/useBallStore"
import type { PositionType } from "@/types/worldTypes"
import { useFrame } from "@react-three/fiber"
import type { RapierRigidBody } from "@react-three/rapier"
import { RigidBody, useBeforePhysicsStep } from "@react-three/rapier"
import { useRef } from "react"
import { PLAYFIELD_ALONG_ACCEL } from "../physics/physicsConfig"
import { usePlayfieldFrame } from "../physics/usePlayfieldFrame"
import {
  BALL_LINEAR_DAMPING,
  BALL_MASS,
  BALL_MAX_SPEED,
  BALL_RADIUS,
  BALL_RESTITUTION,
} from "./ballConfig"

interface BallProps {
  id: string
  position: PositionType
  radius?: number
}

const Ball = ({ id, position, radius = BALL_RADIUS }: BallProps) => {
  const { deleteBall } = useBallStore()
  const isRamping = useBallStore((state) => state.rampingBallIds.includes(id))
  const ballRef = useRef<RapierRigidBody>(null)
  const initialVelocityApplied = useRef(false)
  const hasLanded = useRef(false)
  const initialVelocity = useBallStore(
    (state) => state.balls.find((b) => b.id === id)?.initialVelocity,
  )
  const { localToWorldVector, worldToLocalVector } = usePlayfieldFrame()

  useBeforePhysicsStep(() => {
    const body = ballRef.current
    if (!body) return

    if (!initialVelocityApplied.current && initialVelocity) {
      body.setLinvel({ x: initialVelocity[0], y: initialVelocity[1], z: initialVelocity[2] }, true)
      initialVelocityApplied.current = true
    }

    const forceMagnitude = body.mass() * PLAYFIELD_ALONG_ACCEL
    const worldForce = localToWorldVector({ x: 0, y: 0, z: forceMagnitude })
    body.addForce({ x: worldForce.x, y: worldForce.y, z: worldForce.z }, true)

    if (isRamping) return

    const posWorld = body.translation()
    const posLocal = worldToLocalVector(posWorld)

    if (!hasLanded.current && posLocal.y <= BALL_RADIUS + 0.01) {
      hasLanded.current = true
    }

    if (!hasLanded.current) return

    const velWorld = body.linvel()
    const velLocal = worldToLocalVector(velWorld)
    if (velLocal.y > 0) {
      velLocal.y = 0
      const velWorldClamped = localToWorldVector({
        x: velLocal.x,
        y: velLocal.y,
        z: velLocal.z,
      })
      body.setLinvel({ x: velWorldClamped.x, y: velWorldClamped.y, z: velWorldClamped.z }, true)
    }
  })

  useFrame(() => {
    if (isRamping) return
    const body = ballRef.current
    if (!body) return

    const pos = body.translation()

    if (pos.y <= -2) {
      deleteBall(id)
      return
    }

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
      position={position}
      colliders="ball"
      ccd
      name="ball"
      userData={{ ballId: id }}
      mass={BALL_MASS}
      restitution={BALL_RESTITUTION}
      linearDamping={BALL_LINEAR_DAMPING}
    >
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </RigidBody>
  )
}

export default Ball
