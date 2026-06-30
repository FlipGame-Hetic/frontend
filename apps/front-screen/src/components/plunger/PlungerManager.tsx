import { useMemo } from "react"
import Plunger from "./Plunger"
import type { PositionType } from "@/types/worldTypes"
import {
  cloneWithWorldOrientation,
  getWorldPosition,
  type PlayfieldNodes,
} from "../playfield/usePlayfieldModel"
import type { PlungerMeshPart } from "./simulation/usePlungerSimulation"

// The spring rings in the model are named ring_0, ring_1, etc
const getRingIndex = (name: string): number => {
  return Number(name.replace("ring_", ""))
}

// Express a position relative to the plunger root so the rendered parts can be placed inside the local group
const toLocalPosition = (position: PositionType, root: PositionType): PositionType => {
  return [position[0] - root[0], position[1] - root[1], position[2] - root[2]]
}

const PlungerManager = ({ nodes }: { nodes: PlayfieldNodes }) => {
  const plunger = useMemo(() => {
    const tip = nodes.plunger.find((mesh) => mesh.name === "tip")
    // No tip in the model means no plunger to drive, early returns to fallback
    if (!tip) return null

    // The tip's world position becomes the base everything else is measured with
    const basePosition = getWorldPosition(tip)
    const tipPart: PlungerMeshPart = {
      mesh: cloneWithWorldOrientation(tip),
      position: [0, 0, 0],
    }
    const ringParts = nodes.plunger
      // Keep only the spring rings whose names are ring_0, ring_1, etc (\d means number, \d+ means multiple numbers)
      .filter((mesh) => /^ring_\d+$/.test(mesh.name))
      // Sort them back to front so they line up along the rod
      .sort((a, b) => getRingIndex(a.name) - getRingIndex(b.name))
      .map(
        (mesh): PlungerMeshPart => ({
          mesh: cloneWithWorldOrientation(mesh),
          position: toLocalPosition(getWorldPosition(mesh), basePosition),
        }),
      )

    return {
      position: basePosition,
      tip: tipPart,
      rings: ringParts,
    }
  }, [nodes])

  // If the model has no usable plunger, render the component with its config default position as fallback
  if (!plunger) return <Plunger />

  return <Plunger position={plunger.position} tipMesh={plunger.tip} ringMeshes={plunger.rings} />
}

export default PlungerManager
