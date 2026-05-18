import { useGLTF } from "@react-three/drei"
import { useMemo } from "react"
import { Quaternion, Vector3, type Mesh } from "three"

export const PLAYFIELD_OFFSET: [number, number, number] = [0, -0.8, 0]

export interface PlayfieldNodes {
  cabinet: Mesh[]
  playfield: Mesh[]
  flippers: Mesh[]
  bumpers: Mesh[]
  slingshots: Mesh[]
  targets: Mesh[]
  tunnels: Mesh[]
  lockedBall: Mesh[]
}

function classifyMesh(name: string): keyof PlayfieldNodes | null {
  if (name === "spinner") return null
  if (name === "l_flipper" || name === "r_flipper") return "flippers"
  if (name === "locked_ball") return "lockedBall"
  if (name === "l_tunnel" || name === "tunnel_box") return "tunnels"
  if (name.includes("_bumper")) return "bumpers"
  if (name.endsWith("_slingshot")) return "slingshots"
  if (name.includes("_target_")) return "targets"
  if (name.endsWith("_shape") || name.endsWith("_zone")) return "playfield"
  return "cabinet"
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
  clone.scale.copy(meshScale)
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
  clone.scale.copy(meshScale)
  return clone
}

export function usePlayfieldModel(): PlayfieldNodes {
  const { scene } = useGLTF("/models/playfield.glb")
  return useMemo(() => {
    const result: PlayfieldNodes = {
      cabinet: [],
      playfield: [],
      flippers: [],
      bumpers: [],
      slingshots: [],
      targets: [],
      tunnels: [],
      lockedBall: [],
    }
    scene.traverse((node) => {
      const mesh = node as Mesh
      const bucket = classifyMesh(mesh.name)
      if (!bucket) return
      result[bucket].push(mesh)
    })
    return result
  }, [scene])
}
