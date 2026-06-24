import { RigidBody } from "@react-three/rapier"
import { useMemo } from "react"
import BonusZone from "../bonusZone/BonusZone"
import RailsManager from "../rails/RailsManager"
import SensorsManager from "../sensors/SensorsManager"
import { cloneAtWorldTransform, type PlayfieldNodes } from "./usePlayfieldModel"

const StaticPlayfield = ({ nodes }: { nodes: PlayfieldNodes }) => {
  const clones = useMemo(
    () => ({
      solid: [...nodes.cabinet, ...nodes.playfield, ...nodes.overhead].map(cloneAtWorldTransform),
      bonusZone: nodes.bonusZone.map(cloneAtWorldTransform),
      sensors: nodes.lockedBall.map(cloneAtWorldTransform),
      rails: nodes.rails.map(cloneAtWorldTransform),
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

      <BonusZone nodes={clones.bonusZone} />
      <SensorsManager nodes={clones.sensors} />
      <RailsManager nodes={clones.rails} />
    </>
  )
}

export default StaticPlayfield
