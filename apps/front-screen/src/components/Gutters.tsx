import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { useControls } from "leva"
import { useMemo } from "react"
import type { Vector3Tuple } from "three"
import { GUTTER_FRICTION, GUTTER_RESTITUTION } from "./flipperJoints/jointsConfig"

interface GutterConfig {
  args: [number, number, number]
  position: Vector3Tuple
  rotation: Vector3Tuple
}

const Gutters = () => {
  const { wallX, flipperX, startZ, endZ, height, thickness, friction, restitution } = useControls(
    "Gutters",
    {
      wallX: { value: 0.27, min: 0, max: 0.53, step: 0.003, label: "Walls X" },
      flipperX: { value: 0.12, min: 0, max: 0.53, step: 0.003, label: "Center X" },
      startZ: { value: 0.54, min: 0, max: 0.93, step: 0.003, label: "Start Z" },
      endZ: { value: 0.61, min: 0, max: 0.93, step: 0.003, label: "End Z" },
      height: { value: 0.033, min: 0, max: 0.27, step: 0.003, label: "Height" },
      thickness: { value: 0.007, min: 0, max: 0.2, step: 0.003, label: "Thickess" },
      friction: { value: GUTTER_FRICTION, min: 0, max: 1, step: 0.01, label: "Friction" },
      restitution: {
        value: GUTTER_RESTITUTION,
        min: 0,
        max: 0.2,
        step: 0.001,
        label: "Restitution",
      },
    },
  )

  const gutters = useMemo<GutterConfig[]>(() => {
    const dx = wallX - flipperX
    const dz = endZ - startZ
    const length = Math.sqrt(dx * dx + dz * dz) / 2
    const angle = Math.atan2(dx, dz)

    const centerX = (wallX + flipperX) / 2
    const centerZ = (startZ + endZ) / 2

    return [
      {
        args: [thickness, height, length],
        position: [-centerX, height, centerZ],
        rotation: [0, angle, 0],
      },
      {
        args: [thickness, height, length],
        position: [centerX, height, centerZ],
        rotation: [0, -angle, 0],
      },
    ]
  }, [wallX, flipperX, startZ, endZ, height, thickness])

  return (
    <RigidBody type="fixed" colliders={false}>
      {gutters.map((gutter, i) => (
        <CuboidCollider
          key={i}
          args={gutter.args}
          position={gutter.position}
          rotation={gutter.rotation}
          friction={friction}
          restitution={restitution}
        />
      ))}
    </RigidBody>
  )
}

export default Gutters
