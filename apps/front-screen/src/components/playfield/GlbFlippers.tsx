import { useMemo } from "react"
import FlipperJoints from "../flipperJoints/FlipperJoints"
import { FLIPPER_BLOOM_EMISSIVE_INTENSITY } from "../flipperJoints/jointsConfig"
import { cloneMaterialWithBloom } from "./playfieldBloomMaterials"
import {
  getWorldPosition,
  cloneWithWorldOrientation,
  type PlayfieldNodes,
} from "./usePlayfieldModel"

const GlbFlippers = ({ nodes }: { nodes: PlayfieldNodes }) => {
  const flippers = useMemo(
    () =>
      nodes.flippers.map((mesh) => {
        const side: "left" | "right" = mesh.scale.x < 0 ? "left" : "right"
        const clone = cloneWithWorldOrientation(mesh)
        clone.material = cloneMaterialWithBloom(clone.material, {
          emissiveIntensity: FLIPPER_BLOOM_EMISSIVE_INTENSITY,
        })

        return {
          name: mesh.name,
          side,
          position: getWorldPosition(mesh),
          clone,
        }
      }),
    [nodes],
  )

  return (
    <>
      {flippers.map((f) => (
        <FlipperJoints key={f.name} position={f.position} side={f.side} meshOverride={f.clone} />
      ))}
    </>
  )
}

export default GlbFlippers
