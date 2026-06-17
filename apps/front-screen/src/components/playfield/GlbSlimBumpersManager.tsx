import { useMemo } from "react"
import SlimBumper from "../bumbers/SlimBumper"
import { SLIM_BUMPER_BLOOM_COLOR, SLIM_BUMPER_BLOOM_INTENSITY } from "../bumbers/slimBumperConfig"
import { cloneMaterialWithBloom } from "./playfieldBloomMaterials"
import {
  cloneWithWorldOrientation,
  getWorldPosition,
  type PlayfieldNodes,
} from "./usePlayfieldModel"

const GlbSlimBumpersManager = ({ nodes }: { nodes: PlayfieldNodes }) => {
  const bumpers = useMemo(
    () =>
      nodes.slimBumpers.map((mesh, i) => {
        const clone = cloneWithWorldOrientation(mesh)
        clone.material = cloneMaterialWithBloom(clone.material, {
          emissiveColor: SLIM_BUMPER_BLOOM_COLOR,
          emissiveIntensity: SLIM_BUMPER_BLOOM_INTENSITY,
        })

        return {
          id: i,
          position: getWorldPosition(mesh),
          clone,
        }
      }),
    [nodes],
  )

  return (
    <>
      {bumpers.map(({ id, position, clone }) => (
        <SlimBumper key={clone.uuid} position={position} bumperId={id} meshOverride={clone} />
      ))}
    </>
  )
}

export default GlbSlimBumpersManager
