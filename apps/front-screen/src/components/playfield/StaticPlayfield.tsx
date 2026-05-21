import { useMemo } from "react"
import { RigidBody } from "@react-three/rapier"
import { cloneAtWorldTransform, type PlayfieldNodes } from "./usePlayfieldModel"

export default function StaticPlayfield({ nodes }: { nodes: PlayfieldNodes }) {
  const clones = useMemo(
    () => ({
      solid: [...nodes.cabinet, ...nodes.playfield, ...nodes.overhead].map(cloneAtWorldTransform),
      sensors: nodes.lockedBall.map(cloneAtWorldTransform),
    }),
    [nodes],
  )

  return (
    <>
      <RigidBody type="fixed" colliders="trimesh">
        {clones.solid.map((mesh) => (
          <primitive key={mesh.uuid} object={mesh} />
        ))}
      </RigidBody>

      {clones.sensors.length > 0 && (
        <RigidBody type="fixed" colliders="trimesh" sensor>
          {clones.sensors.map((mesh) => (
            <primitive key={mesh.uuid} object={mesh} />
          ))}
        </RigidBody>
      )}
    </>
  )
}
