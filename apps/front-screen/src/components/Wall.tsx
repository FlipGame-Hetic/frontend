import type { PositionType } from "@/types/worldTypes"
import { CuboidCollider, type CuboidArgs } from "@react-three/rapier"

interface WallProps {
  args: CuboidArgs
  position: PositionType
  rotation?: PositionType
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
