import { useMemo } from "react"
import Target from "../targets/Target"
import { getWorldPosition, type PlayfieldNodes } from "./usePlayfieldModel"

export default function GlbTargetsManager({ nodes }: { nodes: PlayfieldNodes }) {
  const targets = useMemo(
    () => nodes.targets.map((mesh) => ({ mesh, worldPosition: getWorldPosition(mesh) })),
    [nodes],
  )

  return (
    <>
      {targets.map(({ mesh, worldPosition }) => (
        <Target key={mesh.uuid} mesh={mesh} worldPosition={worldPosition} />
      ))}
    </>
  )
}
