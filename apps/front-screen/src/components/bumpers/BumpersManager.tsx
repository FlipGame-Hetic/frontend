import { useMemo } from "react"
import { BONUS_ZONE_BUMPER_BASE_NAMES } from "../bonusZone/bonusZoneConfig"
import { cloneMaterialWithBloom } from "../playfield/playfieldBloomMaterials"
import { buildModuleWithRubber, type PlayfieldNodes } from "../playfield/usePlayfieldModel"
import Bumper from "./Bumper"
import { BUMPER_RUBBER_BLOOM_COLOR, BUMPER_RUBBER_BLOOM_INTENSITY } from "./bumperConfig"

const BumpersManager = ({ nodes }: { nodes: PlayfieldNodes }) => {
  const bumpers = useMemo(
    () =>
      nodes.bumpers.map((base) => {
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
          isCenterMultiballBumper: new Set<string>(BONUS_ZONE_BUMPER_BASE_NAMES).has(base.name),
          ...module,
        }
      }),
    [nodes],
  )

  return (
    <>
      {bumpers.map(({ position, baseClone, rubberClone, isCenterMultiballBumper }) => (
        <Bumper
          key={baseClone.uuid}
          position={position}
          meshOverride={baseClone}
          rubberMesh={rubberClone}
          awardScore={!isCenterMultiballBumper}
        />
      ))}
    </>
  )
}

export default BumpersManager
