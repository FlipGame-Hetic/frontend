import useKeyboard from "@/hooks/useKeyboard"
import type { PositionType } from "@/types/worldTypes"
import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import type { RapierRigidBody } from "@react-three/rapier"
import {
  MeshCollider,
  RigidBody,
  useRevoluteJoint,
  type CollisionEnterPayload,
  type CollisionPayload,
} from "@react-three/rapier"
import { useControls } from "leva"
import { useCallback, useRef, type RefObject } from "react"
import type { Mesh } from "three"
import {
  FLIPPER_ANGVEL_THRESHOLD,
  FLIPPER_BALL_SPEED_CONTRIBUTION,
  FLIPPER_FRICTION,
  FLIPPER_IMPACT_SPEED_THRESHOLD,
  FLIPPER_IMPULSE_MULTIPLIER,
  FLIPPER_JOINT_MASS,
  FLIPPER_MAX_IMPULSE,
  FLIPPER_MESH_OFFSET_X,
  FLIPPER_MIN_IMPULSE,
  FLIPPER_PIVOT_TO_TIP,
  FLIPPER_RESTITUTION,
  LEFT_KEYS,
  MAX_ANGLE,
  MOTOR_DAMPING,
  MOTOR_STIFFNESS,
  REST_ANGLE,
  RIGHT_KEYS,
} from "./jointsConfig"

interface FlipperJointsProps {
  position: PositionType
  side: "left" | "right"
}

const FlipperJoints = ({ position, side }: FlipperJointsProps) => {
  const anchorRef = useRef<RapierRigidBody>(null)
  const flipperRef = useRef<RapierRigidBody>(null)
  const pressedKeys = useKeyboard()
  const ballContactCount = useRef(0)
  const isActivelyFlippingRef = useRef(false)

  const { nodes } = useGLTF("/models/flipperJoints/scene.gltf")
  const flipperGeometry = (nodes.Cube000_0 as Mesh).geometry

  const isLeft = side === "left"
  const activationKeys = isLeft ? LEFT_KEYS : RIGHT_KEYS

  const { autoMode } = useControls("Main", {
    autoMode: false,
  })

  const {
    restAngle,
    maxAngle,
    stiffness,
    damping,
    meshOffsetX,
    mass,
    friction,
    restitution,
    impulseMultiplier,
    angvelThreshold,
    impactSpeedThreshold,
    ballSpeedContribution,
    minImpulse,
    maxImpulse,
    pivotToTip,
  } = useControls("Flippers", {
    restAngle: { value: REST_ANGLE, min: -1.2, max: 0, step: 0.05 },
    maxAngle: { value: MAX_ANGLE, min: 0, max: 1.2, step: 0.05 },
    stiffness: { value: MOTOR_STIFFNESS, min: 100, max: 5000, step: 50 },
    damping: { value: MOTOR_DAMPING, min: 5, max: 500, step: 5 },
    meshOffsetX: { value: FLIPPER_MESH_OFFSET_X, min: 0, max: 1.5, step: 0.05 },
    mass: { value: FLIPPER_JOINT_MASS, min: 0, max: 10.0, step: 0.5 },
    friction: { value: FLIPPER_FRICTION, min: 0, max: 1.0, step: 0.01 },
    restitution: { value: FLIPPER_RESTITUTION, min: 0, max: 0.1, step: 0.001 },
    impulseMultiplier: { value: FLIPPER_IMPULSE_MULTIPLIER, min: 0.1, max: 5.0, step: 0.1 },
    angvelThreshold: { value: FLIPPER_ANGVEL_THRESHOLD, min: 0, max: 5.0, step: 0.1 },
    impactSpeedThreshold: {
      value: FLIPPER_IMPACT_SPEED_THRESHOLD,
      min: 0,
      max: 10,
      step: 0.05,
    },
    ballSpeedContribution: {
      value: FLIPPER_BALL_SPEED_CONTRIBUTION,
      min: 0,
      max: 2,
      step: 0.05,
    },
    minImpulse: { value: FLIPPER_MIN_IMPULSE, min: 0, max: 100, step: 0.5 },
    maxImpulse: { value: FLIPPER_MAX_IMPULSE, min: 1, max: 200, step: 1 },
    pivotToTip: { value: FLIPPER_PIVOT_TO_TIP, min: 0.3, max: 2.0, step: 0.05 },
  })

  const minLimit = isLeft ? restAngle : -maxAngle
  const maxLimit = isLeft ? maxAngle : -restAngle

  const jointRef = useRevoluteJoint(
    anchorRef as unknown as RefObject<RapierRigidBody>,
    flipperRef as unknown as RefObject<RapierRigidBody>,
    [
      [0, 0, 0],
      [0, 0, 0],
      [0, 1, 0],
      [minLimit, maxLimit],
    ],
  )

  useFrame(() => {
    if (!jointRef.current || !flipperRef.current) return

    const keyPressed = activationKeys.some((key) => pressedKeys.current.has(key))
    const isPressed = keyPressed || (autoMode && ballContactCount.current > 0)
    isActivelyFlippingRef.current = isPressed
    const target = isLeft ? (isPressed ? maxAngle : restAngle) : isPressed ? -maxAngle : -restAngle

    jointRef.current.configureMotorPosition(target, stiffness, damping)
  })

  const handleCollisionEnter = useCallback(
    ({ other }: CollisionEnterPayload) => {
      if (other.rigidBodyObject?.name === "ball") {
        ballContactCount.current++
      }

      if (!flipperRef.current || !other.rigidBody) return
      if (other.rigidBodyObject?.name !== "ball") return
      if (!isActivelyFlippingRef.current) return

      const angvel = flipperRef.current.angvel()
      const angSpeed = Math.abs(angvel.y)

      if (angSpeed < angvelThreshold) return

      const flipperPos = flipperRef.current.translation()
      const ballPos = other.rigidBody.translation()

      const dx = ballPos.x - flipperPos.x
      const dz = ballPos.z - flipperPos.z
      const distFromPivot = Math.sqrt(dx * dx + dz * dz)
      const effectiveDist = Math.min(distFromPivot, pivotToTip)

      const tangentialSpeed = angSpeed * effectiveDist

      const sign = Math.sign(angvel.y) * (isLeft ? 1 : -1)
      const dirX = -dz * sign
      const dirZ = dx * sign
      const dirLen = Math.sqrt(dirX * dirX + dirZ * dirZ)

      if (dirLen < 0.001) return

      const nx = dirX / dirLen
      const nz = dirZ / dirLen

      const ballVelocity = other.rigidBody.linvel()
      const ballSpeedAlongFlipper = Math.max(0, ballVelocity.x * nx + ballVelocity.z * nz)

      const ballMass = other.rigidBody.mass()
      const combinedImpactSpeed = tangentialSpeed + ballSpeedAlongFlipper * ballSpeedContribution

      if (combinedImpactSpeed < impactSpeedThreshold) return

      const rawImpulse = combinedImpactSpeed * ballMass * impulseMultiplier
      const impulseMag = Math.min(maxImpulse, Math.max(minImpulse, rawImpulse))

      other.rigidBody.applyImpulse({ x: nx * impulseMag, y: 0, z: nz * impulseMag }, true)
    },
    [
      angvelThreshold,
      ballSpeedContribution,
      impactSpeedThreshold,
      impulseMultiplier,
      isLeft,
      maxImpulse,
      minImpulse,
      pivotToTip,
    ],
  )

  const handleCollisionExit = useCallback(({ other }: CollisionPayload) => {
    if (other.rigidBodyObject?.name === "ball") {
      ballContactCount.current = Math.max(0, ballContactCount.current - 1)
    }
  }, [])

  return (
    <>
      <RigidBody ref={anchorRef} type="fixed" position={position} colliders={false} />
      <RigidBody
        ref={flipperRef}
        type="dynamic"
        position={position}
        colliders={false}
        gravityScale={0}
        ccd
        name={`flipper-${side}`}
        mass={mass}
        restitution={restitution}
        onCollisionEnter={handleCollisionEnter}
        onCollisionExit={handleCollisionExit}
        friction={friction}
      >
        <MeshCollider type="hull">
          <mesh
            geometry={flipperGeometry}
            scale={isLeft ? [0.3, 0.3, 0.3] : [-0.3, 0.3, 0.3]}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[isLeft ? meshOffsetX : -meshOffsetX, 0, 0]}
          >
            <meshStandardMaterial color="#666" />
          </mesh>
        </MeshCollider>
      </RigidBody>
    </>
  )
}

export default FlipperJoints
