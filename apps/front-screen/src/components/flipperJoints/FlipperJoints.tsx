import useKeyboard from "@/hooks/useKeyboard"
import { playSfx } from "@/audio/soundEngine"
import type { PositionType } from "@/types/worldTypes"
import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import type { RapierRigidBody } from "@react-three/rapier"
import { MeshCollider, RigidBody, useRevoluteJoint } from "@react-three/rapier"
import { usePhysicsDebugControls } from "@/debug/physicsDebugContext"
import { useMemo, useRef, type RefObject } from "react"
import { Vector3, type Mesh } from "three"
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
  const prevPressedRef = useRef(false)

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
  } = usePhysicsDebugControls().flippers

  const minLimit = isLeft ? restAngle : -maxAngle
  const maxLimit = isLeft ? maxAngle : -restAngle

  const hingeAxis = useMemo<[number, number, number]>(() => {
    const v = new Vector3(0, 1, 0)
    if (meshOverride) v.applyQuaternion(meshOverride.quaternion)
    return [v.x, v.y, v.z]
  }, [meshOverride])

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
    const isPressed = keyPressedFrame

    if (isPressed && !prevPressedRef.current) playSfx("flipper_up")
    else if (!isPressed && prevPressedRef.current) playSfx("flipper_down")
    prevPressedRef.current = isPressed

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
