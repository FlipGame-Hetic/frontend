import useKeyboard from "@/hooks/useKeyboard"
import type { PositionType } from "@/types/worldTypes"
import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import type { RapierRigidBody } from "@react-three/rapier"
import { MeshCollider, RigidBody, useRevoluteJoint } from "@react-three/rapier"
import { useControls } from "leva"
import { useRef, type RefObject } from "react"
import type { Mesh } from "three"
import {
  FLIPPER_ACTIVE_RESTITUTION,
  FLIPPER_JOINT_MASS,
  FLIPPER_MESH_OFFSET_X,
  FLIPPER_REST_RESTITUTION,
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

  const { nodes } = useGLTF("/models/flipperJoints/scene.gltf")
  const flipperGeometry = (nodes.Cube000_0 as Mesh).geometry

  const isLeft = side === "left"
  const activationKeys = isLeft ? LEFT_KEYS : RIGHT_KEYS

  const {
    restAngle,
    maxAngle,
    stiffness,
    damping,
    meshOffsetX,
    mass,
    activeRestitution,
    restRestitution,
  } = useControls("Flippers", {
    restAngle: { value: REST_ANGLE, min: -1.2, max: 0, step: 0.05 },
    maxAngle: { value: MAX_ANGLE, min: 0, max: 1.2, step: 0.05 },
    stiffness: { value: MOTOR_STIFFNESS, min: 100, max: 5000, step: 50 },
    damping: { value: MOTOR_DAMPING, min: 5, max: 500, step: 5 },
    meshOffsetX: { value: FLIPPER_MESH_OFFSET_X, min: 0, max: 1.5, step: 0.05 },
    mass: { value: FLIPPER_JOINT_MASS, min: 0, max: 10.0, step: 0.5 },
    activeRestitution: { value: FLIPPER_ACTIVE_RESTITUTION, min: 0, max: 5.0, step: 0.1 },
    restRestitution: { value: FLIPPER_REST_RESTITUTION, min: 0, max: 1.0, step: 0.05 },
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

    const isPressed = activationKeys.some((key) => pressedKeys.current.has(key))
    const target = isLeft ? (isPressed ? maxAngle : restAngle) : isPressed ? -maxAngle : -restAngle

    jointRef.current.configureMotorPosition(target, stiffness, damping)

    const currentRestitution = isPressed ? activeRestitution : restRestitution
    for (let i = 0; i < flipperRef.current.numColliders(); i++) {
      flipperRef.current.collider(i).setRestitution(currentRestitution)
    }
  })

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
