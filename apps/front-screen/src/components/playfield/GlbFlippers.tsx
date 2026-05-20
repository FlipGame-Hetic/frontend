import { useMemo } from "react"
import FlipperJoints from "../flipperJoints/FlipperJoints"
import {
  getWorldPosition,
  cloneWithWorldOrientation,
  type PlayfieldNodes,
} from "./usePlayfieldModel"

export default function GlbFlippers({ nodes }: { nodes: PlayfieldNodes }) {
  const flippers = useMemo(
    () =>
      nodes.flippers.map((mesh) => ({
        name: mesh.name,
        side: (mesh.scale.x < 0 ? "left" : "right"),
        position: getWorldPosition(mesh),
        clone: cloneWithWorldOrientation(mesh),
      })),
    [nodes],
  )

  return (
    <>
      {flippers.map((f) => (
        <FlipperJoints key={f.name} position={f.position} side={f.side} meshOverride={f.clone} />
      ))}
    </>
  )
}
