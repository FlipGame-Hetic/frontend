import { useMemo } from "react"
import Plunger, { type PlungerMeshPart } from "../plunger/Plunger"
import type { PositionType } from "@/types/worldTypes"
import {
  cloneWithWorldOrientation,
  getWorldPosition,
  type PlayfieldNodes,
} from "./usePlayfieldModel"

function getRingIndex(name: string): number {
  return Number(name.replace("ring_", ""))
}

function toLocalPosition(position: PositionType, root: PositionType): PositionType {
  return [position[0] - root[0], position[1] - root[1], position[2] - root[2]]
}

export default function GlbPlunger({ nodes }: { nodes: PlayfieldNodes }) {
  const plunger = useMemo(() => {
    const tip = nodes.plunger.find((mesh) => mesh.name === "tip")
    if (!tip) return null

    const rootPosition = getWorldPosition(tip)
    const tipPart: PlungerMeshPart = {
      mesh: cloneWithWorldOrientation(tip),
      position: [0, 0, 0],
    }
    const ringParts = nodes.plunger
      .filter((mesh) => /^ring_\d+$/.test(mesh.name))
      .sort((a, b) => getRingIndex(a.name) - getRingIndex(b.name))
      .map(
        (mesh): PlungerMeshPart => ({
          mesh: cloneWithWorldOrientation(mesh),
          position: toLocalPosition(getWorldPosition(mesh), rootPosition),
        }),
      )

    return {
      position: rootPosition,
      tip: tipPart,
      rings: ringParts,
    }
  }, [nodes])

  if (!plunger) return <Plunger />

  return <Plunger position={plunger.position} tipMesh={plunger.tip} ringMeshes={plunger.rings} />
}
