import { useMemo } from "react"
import Bumper from "../bumbers/Bumper"
import { buildModuleWithRubber, type PlayfieldNodes } from "./usePlayfieldModel"

const GlbBumpersManager = ({ nodes }: { nodes: PlayfieldNodes }) => {
  const bumpers = useMemo(
    () =>
      nodes.bumpers.map((base, i) => ({
        id: i,
        ...buildModuleWithRubber(base, nodes.bumperRubbers, (name) =>
          name.replace("_base", "_rubber"),
        ),
      })),
    [nodes],
  )

  return (
    <>
      {bumpers.map(({ id, position, baseClone, rubberClone }) => (
        <Bumper
          key={baseClone.uuid}
          position={position}
          bumperId={id}
          meshOverride={baseClone}
          rubberMesh={rubberClone}
        />
      ))}
    </>
  )
}

export default GlbBumpersManager
