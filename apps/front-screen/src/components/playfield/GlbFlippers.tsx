import { useMemo } from "react"
import FlipperJoints from "../flipperJoints/FlipperJoints"
import {
  getWorldPosition,
  cloneWithWorldOrientation,
  type PlayfieldNodes,
} from "./usePlayfieldModel"

const GlbFlippers = ({ nodes }: { nodes: PlayfieldNodes }) => {
  const flippers = useMemo(
    () =>
      nodes.flippers.map((mesh) => {
        const side: "left" | "right" = mesh.scale.x < 0 ? "left" : "right"
        return {
          name: mesh.name,
          side,
          position: getWorldPosition(mesh),
          clone: cloneWithWorldOrientation(mesh),
        }
      }),
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

export default GlbFlippers
