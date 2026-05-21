import { useMemo } from "react"
import Spinner from "../spinner/Spinner"
import { getWorldPosition, type PlayfieldNodes } from "./usePlayfieldModel"

export default function GlbSpinnerManager({ nodes }: { nodes: PlayfieldNodes }) {
  const spinners = useMemo(
    () => nodes.spinner.map((mesh) => ({ mesh, worldPosition: getWorldPosition(mesh) })),
    [nodes],
  )

  return (
    <>
      {spinners.map(({ mesh, worldPosition }) => (
        <Spinner key={mesh.uuid} mesh={mesh} worldPosition={worldPosition} />
      ))}
    </>
  )
}
