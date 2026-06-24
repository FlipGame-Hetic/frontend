import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { INVISIBLE_WALLS } from "./invisibleWallsConfig"

const InvisibleWallsManager = () => (
  <>
    {INVISIBLE_WALLS.map((w) => (
      // colliders are false so each wall's collider is placed individually from its config transform
      <RigidBody key={w.id} type="fixed" colliders={false}>
        <CuboidCollider
          args={w.halfExtents}
          position={w.position}
          rotation={w.rotation}
          restitution={w.restitution ?? 0.1}
          friction={w.friction ?? 0}
        />
      </RigidBody>
    ))}
  </>
)

export default InvisibleWallsManager
