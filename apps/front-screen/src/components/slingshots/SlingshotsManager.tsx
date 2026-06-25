import { useMemo } from "react"
import { cloneMaterialWithBloom } from "../playfield/playfieldBloomMaterials"
import {
  cloneWithWorldOrientation,
  getWorldPosition,
  type PlayfieldNodes,
} from "../playfield/usePlayfieldModel"
import Slingshot from "./Slingshot"
import { SLINGSHOT_RUBBER_BLOOM_COLOR, SLINGSHOT_RUBBER_BLOOM_INTENSITY } from "./slingshotConfig"

const SlingshotsManager = ({ nodes }: { nodes: PlayfieldNodes }) => {
  const slingshots = useMemo(
    () =>
      nodes.slingshots.map((mod) => {
        const rubberName = mod.name.replace("_module", "_rubber")
        const rubber = nodes.slingshotRubbers.find((m) => m.name === rubberName)
        const side: "left" | "right" = mod.name.startsWith("l_") ? "left" : "right"
        const rubberClone = rubber ? cloneWithWorldOrientation(rubber) : undefined
        if (rubberClone) {
          rubberClone.material = cloneMaterialWithBloom(rubberClone.material, {
            emissiveColor: SLINGSHOT_RUBBER_BLOOM_COLOR,
            emissiveIntensity: SLINGSHOT_RUBBER_BLOOM_INTENSITY,
          })
        }

        return {
          side,
          position: getWorldPosition(mod),
          moduleClone: cloneWithWorldOrientation(mod),
          rubberClone,
        }
      }),
    [nodes],
  )

  return (
    <>
      {slingshots.map(({ side, position, moduleClone, rubberClone }) => (
        <Slingshot
          key={moduleClone.uuid}
          position={position}
          side={side}
          moduleMesh={moduleClone}
          rubberMesh={rubberClone}
        />
      ))}
    </>
  )
}

export default SlingshotsManager
