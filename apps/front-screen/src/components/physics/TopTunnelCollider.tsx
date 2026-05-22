import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { TOP_TUNNEL_HALF_EXTENTS, TOP_TUNNEL_POSITION, TOP_TUNNEL_ROTATION } from "./physicsConfig"

const TopTunnelCollider = () => (
  <RigidBody type="fixed" colliders={false}>
    <CuboidCollider
      args={TOP_TUNNEL_HALF_EXTENTS}
      position={TOP_TUNNEL_POSITION}
      rotation={TOP_TUNNEL_ROTATION}
      restitution={0.1}
      friction={0}
    />
  </RigidBody>
)

export default TopTunnelCollider
