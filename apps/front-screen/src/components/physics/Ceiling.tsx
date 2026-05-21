import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { CEILING_HALF_EXTENTS, CEILING_ROTATION_X, CEILING_Y } from "./physicsConfig"

const Ceiling = () => (
  <RigidBody type="fixed" colliders={false}>
    <CuboidCollider
      args={CEILING_HALF_EXTENTS}
      rotation={[CEILING_ROTATION_X, 0, 0]}
      position={[0, CEILING_Y, 0]}
      restitution={0.1}
      friction={0}
    />
  </RigidBody>
)

export default Ceiling
