import { RigidBody, type CuboidArgs } from "@react-three/rapier"
import type { Vector3Tuple } from "three"
import Wall from "./Wall"

const WALLS_CONFIG: { args: CuboidArgs; position: Vector3Tuple }[] = [
  { args: [0.1, 1, 7], position: [-4, 0.5, 0] },
  { args: [0.1, 1, 7], position: [4, 0.5, 0] },
  { args: [4.1, 1, 0.1], position: [0, 0.5, -7] },
]

const Walls = () => {
  return (
    <RigidBody type="fixed" colliders={false}>
      {WALLS_CONFIG.map((config, i) => (
        <Wall key={i} args={config.args} position={config.position} />
      ))}
    </RigidBody>
  )
}

export default Walls
