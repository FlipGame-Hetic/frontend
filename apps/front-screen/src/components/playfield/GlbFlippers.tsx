import { useMemo } from "react"
import { type Mesh } from "three"
import FlipperJoints from "../flipperJoints/FlipperJoints"
import { LEFT_POSITION, RIGHT_POSITION } from "../flipperJoints/jointsConfig"
import type { PositionType } from "@/types/worldTypes"
import {
  getWorldPosition,
  cloneWithWorldOrientation,
  type PlayfieldNodes,
} from "./usePlayfieldModel"

function extractPos(mesh: Mesh | undefined, fallback: PositionType): PositionType {
  if (!mesh) return fallback
  return getWorldPosition(mesh)
}

function cloneReset(mesh: Mesh | undefined): Mesh | undefined {
  if (!mesh) return undefined
  return cloneWithWorldOrientation(mesh)
}

export default function GlbFlippers({ nodes }: { nodes: PlayfieldNodes }) {
  const { leftMesh, leftPos, rightMesh, rightPos } = useMemo(() => {
    const lm = nodes.flippers.find((m) => m.name === "l_flipper")
    const rm = nodes.flippers.find((m) => m.name === "r_flipper")
    return {
      leftMesh: cloneReset(lm),
      leftPos: extractPos(lm, LEFT_POSITION),
      rightMesh: cloneReset(rm),
      rightPos: extractPos(rm, RIGHT_POSITION),
    }
  }, [nodes])

  return (
    <>
      <FlipperJoints position={leftPos} side="left" meshOverride={leftMesh} />
      <FlipperJoints position={rightPos} side="right" meshOverride={rightMesh} />
    </>
  )
}
