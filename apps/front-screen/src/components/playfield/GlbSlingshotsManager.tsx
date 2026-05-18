import { useMemo } from "react"
import Slingshot from "../slingshots/Slingshot"
import {
  cloneWithWorldOrientation,
  getWorldPosition,
  type PlayfieldNodes,
} from "./usePlayfieldModel"

function detectSide(name: string): "left" | "right" {
  return name.startsWith("l_") ? "left" : "right"
}

export default function GlbSlingshotsManager({ nodes }: { nodes: PlayfieldNodes }) {
  const slingshots = useMemo(
    () =>
      nodes.slingshots.map((mesh, i) => ({
        id: i,
        side: detectSide(mesh.name),
        position: getWorldPosition(mesh),
        clone: cloneWithWorldOrientation(mesh),
      })),
    [nodes],
  )

  return (
    <>
      {slingshots.map(({ id, side, position, clone }) => (
        <Slingshot
          key={clone.uuid}
          position={position}
          side={side}
          slingshotId={id}
          meshOverride={clone}
        />
      ))}
    </>
  )
}
