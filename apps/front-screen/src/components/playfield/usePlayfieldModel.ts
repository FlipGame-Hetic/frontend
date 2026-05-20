import { useGLTF } from "@react-three/drei"
import { useMemo } from "react"
import type { Object3D } from "three"
import { Mesh, Quaternion, Vector3 } from "three"

export const PLAYFIELD_OFFSET: [number, number, number] = [0, -12, 0]

export interface PlayfieldNodes {
  cabinet: Mesh[]
  playfield: Mesh[]
  flippers: Mesh[]
  bumpers: Mesh[]
  bumperRubbers: Mesh[]
  slimBumpers: Mesh[]
  slingshots: Mesh[]
  slingshotRubbers: Mesh[]
  targets: Mesh[]
  tunnels: Mesh[]
  lockedBall: Mesh[]
}

function classifyMesh(name: string): keyof PlayfieldNodes | null {
  if (name === "spinner") return null
  if (name === "l_flipper_arm" || name === "r_flipper_arm") return "cabinet"
  if (name.startsWith("l_flipper") || name.startsWith("r_flipper")) return "flippers"
  if (name === "locked_ball") return "lockedBall"
  if (name.includes("_bumper_slim")) return "slimBumpers"
  if (name.includes("_bumper_rubber")) return "bumperRubbers"
  if (name.includes("_bumper_base")) return "bumpers"
  if (name.includes("_slingshot_rubber")) return "slingshotRubbers"
  if (name.includes("_slingshot_module")) return "slingshots"
  if (name.includes("_target_")) return "targets"
  if (name.endsWith("_shape") || name.endsWith("_zone")) return "playfield"
  return "cabinet"
}

function isVisibleInHierarchy(mesh: Mesh): boolean {
  let current: Object3D | null = mesh
  while (current) {
    if (!current.visible) return false
    current = current.parent
  }
  return true
}

function isMesh(node: Object3D): node is Mesh {
  return node instanceof Mesh
}

function applyWorldOffset(v: Vector3): [number, number, number] {
  return [v.x + PLAYFIELD_OFFSET[0], v.y + PLAYFIELD_OFFSET[1], v.z + PLAYFIELD_OFFSET[2]]
}

export function getWorldPosition(mesh: Mesh): [number, number, number] {
  mesh.updateWorldMatrix(true, false)
  const pos = new Vector3().setFromMatrixPosition(mesh.matrixWorld)
  return applyWorldOffset(pos)
}

export function cloneAtWorldTransform(mesh: Mesh): Mesh {
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

export function cloneWithWorldOrientation(mesh: Mesh): Mesh {
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

export function usePlayfieldModel(): PlayfieldNodes {
  const { scene } = useGLTF("/models/playfield_x15.glb")
  return useMemo(() => {
    const result: PlayfieldNodes = {
      cabinet: [],
      playfield: [],
      flippers: [],
      bumpers: [],
      bumperRubbers: [],
      slimBumpers: [],
      slingshots: [],
      slingshotRubbers: [],
      targets: [],
      tunnels: [],
      lockedBall: [],
    }
    scene.traverse((node) => {
      if (!isMesh(node)) return
      if (!isVisibleInHierarchy(node)) return
      const bucket = classifyMesh(node.name)
      if (!bucket) return
      result[bucket].push(node)
    })
    return result
  }, [scene])
}
