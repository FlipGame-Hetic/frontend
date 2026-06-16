import { useMemo } from "react"
import Bumper from "../bumbers/Bumper"
import { buildModuleWithRubber, type PlayfieldNodes } from "./usePlayfieldModel"
import { BONUS_ZONE_BUMPER_BASE_NAMES } from "./bonusZoneConfig"
import { useBonusZoneHitRegistrar } from "./bonusZoneHits"

const BONUS_ZONE_BUMPER_BASE_NAME_SET = new Set<string>(BONUS_ZONE_BUMPER_BASE_NAMES)

const GlbBumpersManager = ({ nodes }: { nodes: PlayfieldNodes }) => {
  const registerBonusHit = useBonusZoneHitRegistrar()
  const bumpers = useMemo(
    () =>
      nodes.bumpers.map((base, i) => ({
        id: i,
        isBonusZoneBumper: BONUS_ZONE_BUMPER_BASE_NAME_SET.has(base.name),
        ...buildModuleWithRubber(base, nodes.bumperRubbers, (name) =>
          name.replace("_base", "_rubber"),
        ),
      })),
    [nodes],
  )

  return (
    <>
      {bumpers.map(({ id, position, baseClone, rubberClone, isBonusZoneBumper }) => (
        <Bumper
          key={baseClone.uuid}
          position={position}
          bumperId={id}
          meshOverride={baseClone}
          rubberMesh={rubberClone}
          onBonusHit={isBonusZoneBumper ? registerBonusHit : undefined}
        />
      ))}
    </>
  )
}

export default GlbBumpersManager
