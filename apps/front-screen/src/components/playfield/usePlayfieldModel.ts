import { useGLTF } from "@react-three/drei"
import { useMemo } from "react"
import type { Object3D } from "three"
import { Mesh, Quaternion, Vector3 } from "three"

const PLAYFIELD_OFFSET: [number, number, number] = [0, -12, 0]

export interface PlayfieldNodes {
  cabinet: Mesh[]
  playfield: Mesh[]
  bonusZone: Mesh[]
  flippers: Mesh[]
  bumpers: Mesh[]
  bumperRubbers: Mesh[]
  slimBumpers: Mesh[]
  slingshots: Mesh[]
  slingshotRubbers: Mesh[]
  targets: Mesh[]
  ballSavers: Mesh[]
  plunger: Mesh[]
  overhead: Mesh[]
  tunnels: Mesh[]
  lockedBall: Mesh[]
  spinner: Mesh[]
  rails: Mesh[]
  multiballGateFrame: Mesh[]
  multiballGateDoors: Mesh[]
}

export const classifyMesh = (name: string): keyof PlayfieldNodes | null => {
  if (name === "central_bonus_zone_inter") return "bonusZone"
  if (name === "arch") return "multiballGateFrame"
  if (name === "door_top" || name === "door_bottom") return "multiballGateDoors"
  if (name === "spinner") return "spinner"
  if (name === "tip" || /^ring_\d+$/.test(name)) return "plunger"
  if (name.includes("_ball_saver")) return "ballSavers"
  if (name === "l_rail" || name === "r_rail") return "rails"
  if (name.includes("rail") || name.includes("tunnel")) return "overhead"
  if (name === "l_flipper_arm" || name === "r_flipper_arm") return "cabinet"
  if (name.startsWith("l_flipper") || name.startsWith("r_flipper")) return "flippers"
  if (name === "locked_ball") return "lockedBall"
  if (name.includes("_bumper_slim")) return "slimBumpers"
  if (name.includes("_bumper") && name.includes("_rubber")) return "bumperRubbers"
  if (name.includes("_bumper") && name.includes("_base")) return "bumpers"
  if (name.includes("_slingshot_rubber")) return "slingshotRubbers"
  if (name.includes("_slingshot_module")) return "slingshots"
  if (name.includes("_target_")) return "targets"
  if (name.endsWith("_shape") || name.endsWith("_zone")) return "playfield"
  return "cabinet"
}

const isVisibleInHierarchy = (mesh: Mesh): boolean => {
  let current: Object3D | null = mesh
  while (current) {
    if (!current.visible) return false
    current = current.parent
  }
  return true
}

const isMesh = (node: Object3D): node is Mesh => {
  return node instanceof Mesh
}

const applyWorldOffset = (v: Vector3): [number, number, number] => {
  return [v.x + PLAYFIELD_OFFSET[0], v.y + PLAYFIELD_OFFSET[1], v.z + PLAYFIELD_OFFSET[2]]
}

export const getWorldPosition = (mesh: Mesh): [number, number, number] => {
  mesh.updateWorldMatrix(true, false)
  const pos = new Vector3().setFromMatrixPosition(mesh.matrixWorld)
  return applyWorldOffset(pos)
}

export const cloneAtWorldTransform = (mesh: Mesh): Mesh => {
  mesh.updateWorldMatrix(true, false)
  const clone = mesh.clone()
  const pos = new Vector3()
  const quat = new Quaternion()
  const meshScale = new Vector3()
  mesh.matrixWorld.decompose(pos, quat, meshScale)
  const [wx, wy, wz] = applyWorldOffset(pos)
  clone.position.set(wx, wy, wz)
  clone.quaternion.copy(quat)
  clone.scale.set(meshScale.x, meshScale.y, meshScale.z)
  return clone
}

export const cloneWithWorldOrientation = (mesh: Mesh): Mesh => {
  mesh.updateWorldMatrix(true, false)
  const clone = mesh.clone()
  const _pos = new Vector3()
  const quat = new Quaternion()
  const meshScale = new Vector3()
  mesh.matrixWorld.decompose(_pos, quat, meshScale)
  clone.position.set(0, 0, 0)
  clone.quaternion.copy(quat)
  clone.scale.set(meshScale.x, meshScale.y, meshScale.z)
  return clone
}

export const buildModuleWithRubber = (
  base: Mesh,
  rubbers: Mesh[],
  rubberNameFn: (name: string) => string,
): { position: [number, number, number]; baseClone: Mesh; rubberClone: Mesh | undefined } => {
  const position = getWorldPosition(base)
  const rubberName = rubberNameFn(base.name)
  const rubber = rubbers.find((m) => m.name === rubberName)
  let rubberClone: Mesh | undefined
  if (rubber) {
    rubberClone = cloneWithWorldOrientation(rubber)
    const rubberPos = getWorldPosition(rubber)
    rubberClone.position.set(
      rubberPos[0] - position[0],
      rubberPos[1] - position[1],
      rubberPos[2] - position[2],
    )
  }
  return { position, baseClone: cloneWithWorldOrientation(base), rubberClone }
}

export const usePlayfieldModel = (): PlayfieldNodes => {
  const { scene } = useGLTF("/models/playfield.glb")
  return useMemo(() => {
    const result: PlayfieldNodes = {
      cabinet: [],
      playfield: [],
      bonusZone: [],
      flippers: [],
      bumpers: [],
      bumperRubbers: [],
      slimBumpers: [],
      slingshots: [],
      slingshotRubbers: [],
      targets: [],
      ballSavers: [],
      plunger: [],
      overhead: [],
      tunnels: [],
      lockedBall: [],
      spinner: [],
      rails: [],
      multiballGateFrame: [],
      multiballGateDoors: [],
    }
    scene.traverse((node) => {
      if (!isMesh(node)) return
      if (!isVisibleInHierarchy(node)) return
      node.castShadow = true
      node.receiveShadow = true
      const bucket = classifyMesh(node.name)
      if (!bucket) return
      result[bucket].push(node)
    })
    return result
  }, [scene])
}
