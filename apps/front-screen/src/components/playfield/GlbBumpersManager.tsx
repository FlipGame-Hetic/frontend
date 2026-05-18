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
      nodes.bumpers.map((mesh, i) => ({
        id: i,
        position: getWorldPosition(mesh),
        clone: cloneWithWorldOrientation(mesh),
      })),
    [nodes],
  )

  return (
    <>
      {bumpers.map(({ id, position, clone }) => (
        <Bumper key={clone.uuid} position={position} bumperId={id} meshOverride={clone} />
      ))}
    </>
  )
}
