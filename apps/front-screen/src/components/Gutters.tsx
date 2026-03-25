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
      wallX: { value: 4, min: 0, max: 8, step: 0.05, label: "Walls X" },
      flipperX: { value: 1.85, min: 0, max: 8, step: 0.05, label: "Center X" },
      startZ: { value: 8.05, min: 0, max: 14, step: 0.05, label: "Start Z" },
      endZ: { value: 9.2, min: 0, max: 14, step: 0.05, label: "End Z" },
      height: { value: 0.5, min: 0, max: 4, step: 0.05, label: "Height" },
      thickness: { value: 0.1, min: 0, max: 3, step: 0.05, label: "Thickess" },
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
