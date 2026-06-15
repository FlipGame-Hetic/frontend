import useKeyboard from "@/hooks/useKeyboard"
import { playSfx } from "@/audio/soundEngine"
import type { PositionType } from "@/types/worldTypes"
import { getBallId } from "@/components/balls/ballUserData"
import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import type { CollisionPayload, RapierRigidBody } from "@react-three/rapier"
import { MeshCollider, RigidBody, useRevoluteJoint } from "@react-three/rapier"
import { useDebugControls } from "@/debug/debugContext"
import { pressKey, releaseKey } from "@/stores/inputStore"
import { useMemo, useRef, type RefObject } from "react"
import { Vector3, type Mesh } from "three"
import { projectOnPlayfield } from "../physics/playfieldPlane"
import { isTiltLocked } from "@/physics/tilt"
import {
  LEFT_KEYS,
  RIGHT_KEYS,
  REST_ANGLE,
  MAX_ANGLE,
  MOTOR_SPEED,
  MOTOR_STIFFNESS,
  MOTOR_DAMPING,
  FLIPPER_MESH_OFFSET_X,
  FLIPPER_JOINT_MASS,
  FLIPPER_FRICTION,
  FLIPPER_RESTITUTION,
  FLIPPER_IMPULSE_BOOST,
  FLIPPER_BOOST_MIN_ANGULAR_SPEED,
  FLIPPER_BOOST_COOLDOWN_MS,
} from "./jointsConfig"

interface FlipperJointsProps {
  position: PositionType
  side: "left" | "right"
  meshOverride?: Mesh
}

const FlipperJoints = ({ position, side, meshOverride }: FlipperJointsProps) => {
  const anchorRef = useRef<RapierRigidBody>(null)
  const flipperRef = useRef<RapierRigidBody>(null)
  const pressedKeys = useKeyboard()
  const appliedLimitsRef = useRef({ min: NaN, max: NaN })
  const prevPressedRef = useRef(false)
  const { autoMode } = useDebugControls()
  const isAutoPressingRef = useRef(false)
  const boostCooldownsRef = useRef(new Map<string, number>())

  const { nodes } = useGLTF(`${import.meta.env.BASE_URL}models/flipperJoints/scene.gltf`)
  const flipperGeometry = (nodes.Cube000_0 as Mesh).geometry

  const isLeft = side === "left"
  const activationKeys = isLeft ? LEFT_KEYS : RIGHT_KEYS

  const minLimit = isLeft ? REST_ANGLE : -MAX_ANGLE
  const maxLimit = isLeft ? MAX_ANGLE : -REST_ANGLE

  const hingeAxis = useMemo<[number, number, number]>(() => {
    const v = new Vector3(0, 1, 0)
    if (meshOverride) v.applyQuaternion(meshOverride.quaternion)
    return [v.x, v.y, v.z]
  }, [meshOverride])

  const applyBallBoost = ({ other }: CollisionPayload) => {
    const flipper = flipperRef.current
    if (!flipper) return
    if (other.rigidBodyObject?.name !== "ball") return

    const ballId = getBallId(other.rigidBodyObject.userData)
    const ballBody = other.rigidBody
    if (!ballId || !ballBody) return

    const now = performance.now()
    const lastBoost = boostCooldownsRef.current.get(ballId) ?? 0
    if (now - lastBoost < FLIPPER_BOOST_COOLDOWN_MS) return

    const angvel = flipper.angvel()
    const upswingSpeed =
      (angvel.x * hingeAxis[0] + angvel.y * hingeAxis[1] + angvel.z * hingeAxis[2]) *
      (isLeft ? 1 : -1)
    if (upswingSpeed < FLIPPER_BOOST_MIN_ANGULAR_SPEED) return

    const ballPos = ballBody.translation()
    const rx = ballPos.x - position[0]
    const ry = ballPos.y - position[1]
    const rz = ballPos.z - position[2]
    const contactVelocity = projectOnPlayfield({
      x: angvel.y * rz - angvel.z * ry,
      y: angvel.z * rx - angvel.x * rz,
      z: angvel.x * ry - angvel.y * rx,
    })
    const contactSpeed = Math.hypot(contactVelocity.x, contactVelocity.y, contactVelocity.z)
    if (contactSpeed < 0.001) return

    const impulseScale = FLIPPER_IMPULSE_BOOST * ballBody.mass()
    ballBody.applyImpulse(
      {
        x: contactVelocity.x * impulseScale,
        y: contactVelocity.y * impulseScale,
        z: contactVelocity.z * impulseScale,
      },
      true,
    )
    boostCooldownsRef.current.set(ballId, now)
  }

  const jointRef = useRevoluteJoint(
    anchorRef as unknown as RefObject<RapierRigidBody>,
    flipperRef as unknown as RefObject<RapierRigidBody>,
    [[0, 0, 0], [0, 0, 0], hingeAxis, [minLimit, maxLimit]],
  )

  useFrame(() => {
    if (!jointRef.current || !flipperRef.current) return

    if (appliedLimitsRef.current.min !== minLimit || appliedLimitsRef.current.max !== maxLimit) {
      jointRef.current.setLimits(minLimit, maxLimit)
      appliedLimitsRef.current = { min: minLimit, max: maxLimit }
    }

    const keyPressedFrame = activationKeys.some((key) => pressedKeys.current.has(key))
    const isPressed = keyPressedFrame && !isTiltLocked()

    if (isPressed && !prevPressedRef.current) playSfx("flipper_up")
    else if (!isPressed && prevPressedRef.current) playSfx("flipper_down")
    prevPressedRef.current = isPressed

    const target = isLeft
      ? isPressed
        ? MAX_ANGLE
        : REST_ANGLE
      : isPressed
        ? -MAX_ANGLE
        : -REST_ANGLE
    const targetVelocity = isLeft
      ? isPressed
        ? MOTOR_SPEED
        : -MOTOR_SPEED
      : isPressed
        ? -MOTOR_SPEED
        : MOTOR_SPEED

    jointRef.current.configureMotor(target, targetVelocity, MOTOR_STIFFNESS, MOTOR_DAMPING)
  }, -1)

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
        mass={FLIPPER_JOINT_MASS}
        restitution={FLIPPER_RESTITUTION}
        friction={FLIPPER_FRICTION}
        onCollisionEnter={(payload) => {
          applyBallBoost(payload)
          if (!autoMode || isAutoPressingRef.current) return
          isAutoPressingRef.current = true
          activationKeys.forEach(pressKey)
          setTimeout(() => {
            activationKeys.forEach(releaseKey)
            isAutoPressingRef.current = false
          }, 200)
        }}
      >
        <MeshCollider type="hull">
          {meshOverride ? (
            <mesh
              geometry={meshOverride.geometry}
              material={meshOverride.material}
              quaternion={meshOverride.quaternion}
              scale={meshOverride.scale}
            />
          ) : (
            <mesh
              geometry={flipperGeometry}
              scale={isLeft ? [0.3, 0.3, 0.3] : [-0.3, 0.3, 0.3]}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[isLeft ? FLIPPER_MESH_OFFSET_X : -FLIPPER_MESH_OFFSET_X, 0, 0]}
            >
              <meshStandardMaterial color="#666" />
            </mesh>
          )}
        </MeshCollider>
      </RigidBody>
    </>
  )
}

export default FlipperJoints
