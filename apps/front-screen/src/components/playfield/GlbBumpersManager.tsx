import { useMemo } from "react"
import Bumper from "../bumbers/Bumper"
import {
  cloneWithWorldOrientation,
  getWorldPosition,
  type PlayfieldNodes,
} from "./usePlayfieldModel"

export default function GlbBumpersManager({ nodes }: { nodes: PlayfieldNodes }) {
  const bumpers = useMemo(
    () =>
      nodes.bumpers.map((base, i) => {
        const rubberName = base.name.replace("_base", "_rubber")
        const rubber = nodes.bumperRubbers.find((m) => m.name === rubberName)
        return {
          id: i,
          position: getWorldPosition(base),
          baseClone: cloneWithWorldOrientation(base),
          rubberClone: rubber ? cloneWithWorldOrientation(rubber) : undefined,
        }
      }),
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
