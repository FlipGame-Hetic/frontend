import { useMemo } from "react"
import { getWorldPosition, type PlayfieldNodes } from "../playfield/usePlayfieldModel"
import Target from "./Target"

const TargetsManager = ({ nodes }: { nodes: PlayfieldNodes }) => {
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

export default TargetsManager
