import { useMemo } from "react"
import { cloneMaterialWithBloom } from "../playfield/playfieldBloomMaterials"
import {
  cloneWithWorldOrientation,
  getWorldPosition,
  type PlayfieldNodes,
} from "../playfield/usePlayfieldModel"
import SlimBumper from "./SlimBumper"
import { SLIM_BUMPER_BLOOM_COLOR, SLIM_BUMPER_BLOOM_INTENSITY } from "./slimBumperConfig"

const SlimBumpersManager = ({ nodes }: { nodes: PlayfieldNodes }) => {
  const bumpers = useMemo(
    () =>
      nodes.slimBumpers.map((mesh) => {
        const clone = cloneWithWorldOrientation(mesh)
        clone.material = cloneMaterialWithBloom(clone.material, {
          emissiveColor: SLIM_BUMPER_BLOOM_COLOR,
          emissiveIntensity: SLIM_BUMPER_BLOOM_INTENSITY,
        })

        return {
          position: getWorldPosition(mesh),
          clone,
        }
      }),
    [nodes],
  )

  return (
    <>
      {bumpers.map(({ position, clone }) => (
        <SlimBumper key={clone.uuid} position={position} meshOverride={clone} />
      ))}
    </>
  )
}

export default SlimBumpersManager
