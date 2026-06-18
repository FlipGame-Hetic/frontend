import { useMemo } from "react"
import Bumper from "../bumbers/Bumper"
import { BUMPER_RUBBER_BLOOM_COLOR, BUMPER_RUBBER_BLOOM_INTENSITY } from "../bumbers/bumperConfig"
import { cloneMaterialWithBloom } from "./playfieldBloomMaterials"
import { buildModuleWithRubber, type PlayfieldNodes } from "./usePlayfieldModel"
import { BONUS_ZONE_BUMPER_BASE_NAMES } from "./bonusZoneConfig"

const BONUS_ZONE_BUMPER_BASE_NAME_SET = new Set<string>(BONUS_ZONE_BUMPER_BASE_NAMES)

const GlbBumpersManager = ({ nodes }: { nodes: PlayfieldNodes }) => {
  const bumpers = useMemo(
    () =>
      nodes.bumpers.map((base, i) => {
        const module = buildModuleWithRubber(base, nodes.bumperRubbers, (name) =>
          name.replace("_base", "_rubber"),
        )

        if (module.rubberClone) {
          module.rubberClone.material = cloneMaterialWithBloom(module.rubberClone.material, {
            emissiveColor: BUMPER_RUBBER_BLOOM_COLOR,
            emissiveIntensity: BUMPER_RUBBER_BLOOM_INTENSITY,
          })
        }

        return {
          id: i,
          isCenterMultiballBumper: BONUS_ZONE_BUMPER_BASE_NAME_SET.has(base.name),
          ...module,
        }
      }),
    [nodes],
  )

  return (
    <>
      {bumpers.map(({ id, position, baseClone, rubberClone, isCenterMultiballBumper }) => (
        <Bumper
          key={baseClone.uuid}
          position={position}
          bumperId={id}
          meshOverride={baseClone}
          rubberMesh={rubberClone}
          awardScore={!isCenterMultiballBumper}
        />
      ))}
    </>
  )
}

export default GlbBumpersManager
