import { useMemo } from "react"
import { cloneMaterialWithBloom } from "../playfield/playfieldBloomMaterials"
import {
  getWorldPosition,
  cloneWithWorldOrientation,
  type PlayfieldNodes,
} from "../playfield/usePlayfieldModel"
import Flipper from "./Flipper"
import { FLIPPER_BLOOM_EMISSIVE_INTENSITY } from "./flipperConfig"

const FlippersManager = ({ nodes }: { nodes: PlayfieldNodes }) => {
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
        <Flipper key={f.name} position={f.position} side={f.side} mesh={f.clone} />
      ))}
    </>
  )
}

export default FlippersManager
