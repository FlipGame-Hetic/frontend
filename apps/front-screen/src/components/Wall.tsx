import { CuboidCollider, type CuboidArgs } from "@react-three/rapier"
import type { Vector3Tuple } from "three"

interface WallProps {
  args: CuboidArgs
  position: Vector3Tuple
  rotation?: Vector3Tuple
}

const Wall = ({ args, position, rotation }: WallProps) => {
  const geometryArgs = args.map((arg) => arg * 2) as [number, number, number]

  return (
    <CuboidCollider args={args} position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={geometryArgs} />
        <meshStandardMaterial />
      </mesh>
    </CuboidCollider>
  )
}

export default Wall
