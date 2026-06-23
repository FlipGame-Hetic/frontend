import { useMemo } from "react"
import SlimBumper from "../bumpers/SlimBumper"
import { SLIM_BUMPER_BLOOM_COLOR, SLIM_BUMPER_BLOOM_INTENSITY } from "../bumpers/slimBumperConfig"
import { cloneMaterialWithBloom } from "./playfieldBloomMaterials"
import {
  cloneWithWorldOrientation,
  getWorldPosition,
  type PlayfieldNodes,
} from "./usePlayfieldModel"

const GlbSlimBumpersManager = ({ nodes }: { nodes: PlayfieldNodes }) => {
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

export default GlbSlimBumpersManager
