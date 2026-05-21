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
        const position = getWorldPosition(base)
        let rubberClone: ReturnType<typeof cloneWithWorldOrientation> | undefined
        if (rubber) {
          rubberClone = cloneWithWorldOrientation(rubber)
          const rubberPos = getWorldPosition(rubber)
          rubberClone.position.set(
            rubberPos[0] - position[0],
            rubberPos[1] - position[1],
            rubberPos[2] - position[2],
          )
        }
        return {
          id: i,
          position,
          baseClone: cloneWithWorldOrientation(base),
          rubberClone,
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
