import { useGLTF } from "@react-three/drei"
import { useMemo } from "react"
import { type AnimationClip, type Object3D, Mesh, Quaternion, Vector3 } from "three"

// The playfield model sits 12 units too high on Y, so every position read from it is lowered by 12 to line up with the rest of the scene
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
  multiballGateFrame: Object3D[]
  multiballGateDoors: Object3D[]
  animatedGroups: Object3D[]
}

interface ClassificationRule {
  bucket: keyof PlayfieldNodes
  matches: (name: string) => boolean
}

// The flipper arm mesh is decorative, the physics flipper is built separately, so keep it out of the flippers bucket
const isDecorativeFlipperArm = (name: string): boolean => {
  return name === "l_flipper_arm" || name === "r_flipper_arm"
}

// Order matters : first matching rule wins, so specific names must come before the broad includes() rules below
const CLASSIFICATION_RULES: ClassificationRule[] = [
  { bucket: "animatedGroups", matches: (name) => name === "globe" },
  { bucket: "bonusZone", matches: (name) => name === "central_bonus_zone_inter" },
  { bucket: "multiballGateFrame", matches: (name) => name === "arch" },
  {
    bucket: "multiballGateDoors",
    matches: (name) => name === "door_top" || name === "door_bottom",
  },
  { bucket: "spinner", matches: (name) => name === "spinner" },
  { bucket: "plunger", matches: (name) => name === "tip" || /^ring_\d+$/.test(name) },
  { bucket: "ballSavers", matches: (name) => name.includes("_ball_saver") },
  { bucket: "rails", matches: (name) => name === "l_rail" || name === "r_rail" },
  { bucket: "overhead", matches: (name) => name.includes("rail") || name.includes("tunnel") },
  { bucket: "cabinet", matches: isDecorativeFlipperArm },
  {
    bucket: "flippers",
    matches: (name) =>
      (name.startsWith("l_flipper") || name.startsWith("r_flipper")) &&
      !isDecorativeFlipperArm(name),
  },
  { bucket: "lockedBall", matches: (name) => name === "locked_ball" },
  { bucket: "slimBumpers", matches: (name) => name.includes("_bumper_slim") },
  {
    bucket: "bumperRubbers",
    matches: (name) => name.includes("_bumper") && name.includes("_rubber"),
  },
  { bucket: "bumpers", matches: (name) => name.includes("_bumper") && name.includes("_base") },
  { bucket: "slingshotRubbers", matches: (name) => name.includes("_slingshot_rubber") },
  { bucket: "slingshots", matches: (name) => name.includes("_slingshot_module") },
  { bucket: "targets", matches: (name) => name.includes("_target_") },
  { bucket: "playfield", matches: (name) => name.endsWith("_shape") || name.endsWith("_zone") },
]

export const classifyMesh = (name: string): keyof PlayfieldNodes | null => {
  // Unknown visible meshes are treated as cabinet decorations by default
  return CLASSIFICATION_RULES.find((rule) => rule.matches(name))?.bucket ?? "cabinet"
}

const isBucket =
  <T extends keyof PlayfieldNodes>(...buckets: T[]) =>
  (bucket: keyof PlayfieldNodes | null): bucket is T =>
    buckets.includes(bucket as T)

const isMultiballGateBucket = isBucket("multiballGateFrame", "multiballGateDoors")
const isAnimatedGroupBucket = isBucket("animatedGroups")

const hasBucketAncestor = (
  node: Object3D,
  matchesBucket: (bucket: keyof PlayfieldNodes | null) => boolean,
): boolean => {
  let current = node.parent
  while (current) {
    if (matchesBucket(classifyMesh(current.name))) return true
    current = current.parent
  }
  return false
}

const hasMultiballGateAncestor = (node: Object3D): boolean => {
  return hasBucketAncestor(node, isMultiballGateBucket)
}

const hasAnimatedGroupAncestor = (node: Object3D): boolean => {
  return hasBucketAncestor(node, isAnimatedGroupBucket)
}

const applyWorldOffset = (v: Vector3): [number, number, number] => {
  return [v.x + PLAYFIELD_OFFSET[0], v.y + PLAYFIELD_OFFSET[1], v.z + PLAYFIELD_OFFSET[2]]
}

// World position of a mesh in the play space, after applying the global playfield offset
export const getWorldPosition = (mesh: Mesh): [number, number, number] => {
  mesh.updateWorldMatrix(true, false)
  const pos = new Vector3().setFromMatrixPosition(mesh.matrixWorld)
  return applyWorldOffset(pos)
}

// Clones an object with its full world transform baked in, so it can be dropped straight into the scene root where it belongs
export const cloneAtWorldTransform = <T extends Object3D>(object: T): T => {
  object.updateWorldMatrix(true, false)
  const clone = object.clone()
  const pos = new Vector3()
  const quat = new Quaternion()
  const meshScale = new Vector3()
  object.matrixWorld.decompose(pos, quat, meshScale)
  const [wx, wy, wz] = applyWorldOffset(pos)
  clone.position.set(wx, wy, wz)
  clone.quaternion.copy(quat)
  clone.scale.set(meshScale.x, meshScale.y, meshScale.z)
  return clone
}

// Like cloneAtWorldTransform but keeps the world rotation/scale
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

// Clones a module's base mesh plus its matching rubber, the rubber offset relative to the base so the pair stays together
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

const createEmptyPlayfieldNodes = (): PlayfieldNodes => ({
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
  animatedGroups: [],
})

const isVisibleInHierarchy = (object: Object3D): boolean => {
  let current: Object3D | null = object
  while (current) {
    if (!current.visible) return false
    current = current.parent
  }
  return true
}

export const isMesh = (node: Object3D): node is Mesh => {
  return node instanceof Mesh
}

const applyShadowsToMeshes = (object: Object3D) => {
  object.traverse((node) => {
    if (!isMesh(node)) return
    node.castShadow = true
    node.receiveShadow = true
  })
}

// Traverse the GLB scene once and sort every visible node into the corresponding bucket (rails, bumpers, ball savers...)
export const collectPlayfieldNodes = (scene: Object3D): PlayfieldNodes => {
  const result = createEmptyPlayfieldNodes()

  scene.traverse((node) => {
    if (!isVisibleInHierarchy(node)) return

    const bucket = classifyMesh(node.name)
    // Animated groups and the multiball gate are kept as whole subtrees, not split into classic buckets, because their animations and moving parts are bound to the group hierarchy
    if (isAnimatedGroupBucket(bucket) || isMultiballGateBucket(bucket)) {
      applyShadowsToMeshes(node)
      result[bucket].push(node)
      return
    }

    if (hasAnimatedGroupAncestor(node)) return
    if (hasMultiballGateAncestor(node)) return
    if (!isMesh(node)) return

    node.castShadow = true
    node.receiveShadow = true
    if (!bucket) return
    result[bucket].push(node)
  })

  return result
}

interface PlayfieldModel {
  nodes: PlayfieldNodes
  animations: AnimationClip[]
}

const usePlayfieldModel = (): PlayfieldModel => {
  const { scene, animations } = useGLTF("/models/playfield/playfield.glb")
  const nodes = useMemo(() => collectPlayfieldNodes(scene), [scene])

  return useMemo(() => ({ nodes, animations }), [animations, nodes])
}

export default usePlayfieldModel
