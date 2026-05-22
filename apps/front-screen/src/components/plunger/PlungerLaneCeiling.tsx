import { CuboidCollider, RigidBody } from "@react-three/rapier"
import {
  PLUNGER_CEILING_HALF_EXTENTS,
  PLUNGER_CEILING_POSITION,
  PLUNGER_CEILING_ROTATION_X,
} from "./plungerConfig"

const PlungerLaneCeiling = () => (
  <RigidBody type="fixed" colliders={false}>
    <CuboidCollider
      args={PLUNGER_CEILING_HALF_EXTENTS}
      position={PLUNGER_CEILING_POSITION}
      rotation={[PLUNGER_CEILING_ROTATION_X, 0, 0]}
      restitution={0.1}
      friction={0}
    />
  </RigidBody>
)

export default PlungerLaneCeiling
