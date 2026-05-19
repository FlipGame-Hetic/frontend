import useKeyboard from "@/hooks/useKeyboard"
import { getPressedKeys } from "@/stores/inputStore"
import type { PositionType } from "@/types/worldTypes"
import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import type { RapierRigidBody } from "@react-three/rapier"
import { MeshCollider, RigidBody, useRevoluteJoint } from "@react-three/rapier"
import { usePhysicsDebugControls } from "@/debug/physicsDebugContext"
import { useMemo, useRef, type RefObject } from "react"
import { Euler, Quaternion, type Mesh } from "three"
import { LEFT_KEYS, RIGHT_KEYS } from "./jointsConfig"

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

  const { nodes } = useGLTF(`${import.meta.env.BASE_URL}models/flipperJoints/scene.gltf`)
  const flipperGeometry = (nodes.Cube000_0 as Mesh).geometry

  const isLeft = side === "left"
  const activationKeys = isLeft ? LEFT_KEYS : RIGHT_KEYS

  const {
    restAngle,
    maxAngle,
    motorSpeed,
    stiffness,
    damping,
    meshOffsetX,
    mass,
    friction,
    restitution,
    activeTiltXDeg,
    activeTiltZDeg,
  } = usePhysicsDebugControls().flippers

  const keyPressed = activationKeys.some((key) => getPressedKeys().has(key))
  const activeTiltXRad = keyPressed ? (activeTiltXDeg * Math.PI) / 180 : 0
  const activeTiltZSignedDeg = isLeft ? activeTiltZDeg : -activeTiltZDeg
  const activeTiltZRad = keyPressed ? (activeTiltZSignedDeg * Math.PI) / 180 : 0
  const colliderKey = keyPressed
    ? `tilted-${String(activeTiltXDeg)}-${String(activeTiltZSignedDeg)}`
    : "rest"

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

    if (appliedLimitsRef.current.min !== minLimit || appliedLimitsRef.current.max !== maxLimit) {
      jointRef.current.setLimits(minLimit, maxLimit)
      appliedLimitsRef.current = { min: minLimit, max: maxLimit }
    }

    const keyPressedFrame = activationKeys.some((key) => pressedKeys.current.has(key))
    const isPressed = keyPressedFrame
    const target = isLeft ? (isPressed ? maxAngle : restAngle) : isPressed ? -maxAngle : -restAngle
    const targetVelocity = isLeft
      ? isPressed
        ? motorSpeed
        : -motorSpeed
      : isPressed
        ? -motorSpeed
        : motorSpeed

    jointRef.current.configureMotor(target, targetVelocity, stiffness, damping)
  }, -1)

  const meshOrientation = useMemo(() => {
    if (!meshOverride) return undefined
    if (!keyPressed) return meshOverride.quaternion
    const tilt = new Quaternion().setFromEuler(new Euler(activeTiltXRad, 0, activeTiltZRad))
    return meshOverride.quaternion.clone().multiply(tilt)
  }, [activeTiltXRad, activeTiltZRad, keyPressed, meshOverride])

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
        friction={friction}
      >
        <MeshCollider type="hull">
          {meshOverride ? (
            <primitive object={meshOverride} />
          ) : (
            <mesh
              geometry={flipperGeometry}
              scale={isLeft ? [0.3, 0.3, 0.3] : [-0.3, 0.3, 0.3]}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[isLeft ? meshOffsetX : -meshOffsetX, 0, 0]}
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
