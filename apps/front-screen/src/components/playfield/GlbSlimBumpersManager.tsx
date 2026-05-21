import { useMemo } from "react"
import SlimBumper from "../bumbers/SlimBumper"
import {
  cloneWithWorldOrientation,
  getWorldPosition,
  type PlayfieldNodes,
} from "./usePlayfieldModel"

export default function GlbSlimBumpersManager({ nodes }: { nodes: PlayfieldNodes }) {
  const bumpers = useMemo(
    () =>
      nodes.slimBumpers.map((mesh, i) => ({
        id: i,
        position: getWorldPosition(mesh),
        clone: cloneWithWorldOrientation(mesh),
      })),
    [nodes],
  )

  return (
    <>
      {bumpers.map(({ id, position, clone }) => (
        <SlimBumper key={clone.uuid} position={position} bumperId={id} meshOverride={clone} />
      ))}
    </>
  )
}
