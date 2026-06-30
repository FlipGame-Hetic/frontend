import { getBallId } from "@/components/balls/runtime/ballUserData"
import { getCurrentBallColorSnapshot } from "@/config/characterConfig"
import useBallStore from "@/stores/useBallStore"
import type { PositionType } from "@/types/worldTypes"
import { useFrame } from "@react-three/fiber"
import type { CollisionEnterPayload, CollisionPayload, RapierRigidBody } from "@react-three/rapier"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { Material, Object3D } from "three"
import { Box3, Color, Euler, Matrix4, Plane, Vector3 } from "three"
import {
  cloneMaterialWithBloom,
  hasEmissiveControls,
  type BloomMaterialOptions,
  type EmissiveMaterial,
} from "../../playfield/playfieldBloomMaterials"
import {
  cloneAtWorldTransform,
  isMesh,
  type PlayfieldNodes,
} from "../../playfield/usePlayfieldModel"
import {
  BONUS_ZONE_RESTITUTION,
  MULTIBALL_GATE_ARCH_BLOOM_INTENSITY,
  MULTIBALL_GATE_ARCH_CLOSED_BLOOM_INTENSITY,
  MULTIBALL_GATE_ARCH_OPEN_COLOR,
  MULTIBALL_GATE_HALF_EXTENTS,
  MULTIBALL_GATE_OPEN_DISTANCE,
  MULTIBALL_GATE_POSITION,
} from "../bonusZoneConfig"
import { useBonusZoneHitRegistry } from "../bonusZoneHits"
import {
  advanceMultiballGateState,
  createOpenMultiballGateState,
  hasClearedMultiballGate,
  isMultiballGateClosingVelocity,
  shouldCloseMultiballGateFromSensorExit,
  shouldTrackBallInSensor,
  triggerMultiballGateClose,
  type MultiballGateState,
} from "./multiballGateRuntime"

interface PreparedGate {
  frame?: Object3D
  topDoor: Object3D
  bottomDoor: Object3D
  topClosedPosition: Vector3
  bottomClosedPosition: Vector3
  openAxis: Vector3
  colliderArgs: PositionType
  colliderPosition: PositionType
  colliderRotation: PositionType
  frameColliders: GateFrameCollider[]
  archBloomMaterials: EmissiveMaterial[]
}

interface GateFrameCollider {
  id: string
  args: PositionType
  position: PositionType
}

const toTuple = (v: Vector3): PositionType => [v.x, v.y, v.z]
const ARCH_OPEN_COLOR = new Color(MULTIBALL_GATE_ARCH_OPEN_COLOR)
// Reused buffer for the closed-state arch color, filled from the current ball color each frame
const ARCH_CLOSED_COLOR = new Color()

// The arch glow comes from the model material named softbluelight
const isMultiballGateArchBloomMaterial = (material: Material): boolean => {
  return material.name === "softbluelight"
}

// Clones a material so animating it never mutates the shared one on the source model, with optional clip plane and bloom
const cloneNodeMaterial = (
  material: Material | Material[],
  clippingPlane?: Plane,
  bloomOptions?: BloomMaterialOptions,
) => {
  const cloned = bloomOptions
    ? cloneMaterialWithBloom(material, bloomOptions)
    : Array.isArray(material)
      ? material.map((m) => m.clone())
      : material.clone()

  if (clippingPlane) {
    for (const m of Array.isArray(cloned) ? cloned : [cloned]) {
      m.clippingPlanes = [clippingPlane]
      m.needsUpdate = true
    }
  }

  return cloned
}

// For every mesh under an object, replaces its material for a cloned one
const cloneMaterials = (
  object: Object3D,
  clippingPlane?: Plane,
  bloomOptions?: BloomMaterialOptions,
) => {
  object.traverse((node) => {
    if (!isMesh(node)) return
    node.material = cloneNodeMaterial(node.material, clippingPlane, bloomOptions)
  })
}

// Gathers the arch glow materials we will animate, only those that actually expose emissive controls
const collectArchBloomMaterials = (object: Object3D): EmissiveMaterial[] => {
  const materials: EmissiveMaterial[] = []

  object.traverse((node) => {
    if (!isMesh(node)) return
    const nodeMaterials = Array.isArray(node.material) ? node.material : [node.material]
    for (const material of nodeMaterials) {
      // Early 'continues' if the material is not for the arch bloom
      if (!isMultiballGateArchBloomMaterial(material)) continue
      if (!hasEmissiveControls(material)) continue
      materials.push(material)
    }
  })

  return materials
}

// Bounding box of the object measured in its own local space, ignoring where it is in the world
const getLocalObjectBox = (object: Object3D): Box3 => {
  object.updateWorldMatrix(true, true)
  const rootInverse = object.matrixWorld.clone().invert()
  const box = new Box3()

  object.traverse((node) => {
    if (!isMesh(node)) return

    node.geometry.computeBoundingBox()
    const geometryBox = node.geometry.boundingBox
    if (!geometryBox) return

    node.updateWorldMatrix(true, false)
    // Bring each child box back into the root's local frame before merging it in
    const nodeToRoot = new Matrix4().multiplyMatrices(rootInverse, node.matrixWorld)
    box.union(geometryBox.clone().applyMatrix4(nodeToRoot))
  })

  return box
}

// Bounding box of the object in world space, axis aligned to the scene
const getWorldBox = (object: Object3D): Box3 => {
  object.updateWorldMatrix(true, false)
  return new Box3().setFromObject(object)
}

// Clip plane that hides the top door above a line halfway through the arch
const getTopDoorClipPlane = (topDoor: Object3D, frame: Object3D | undefined): Plane => {
  const topDoorBox = getWorldBox(topDoor)
  const frameBox = frame ? getWorldBox(frame) : null
  // Fall back to a small offset above the door when there is no frame to measure
  const frameTopY = frameBox?.max.y ?? topDoorBox.max.y + 0.12
  const clipY = topDoorBox.max.y + (frameTopY - topDoorBox.max.y) * 0.5

  // The Y points down so everything above clipY gets cut
  return new Plane(new Vector3(0, -1, 0), clipY)
}

// Builds a box collider spanning min to max, or null when the span is too thin to be worth a collider
const boxColliderFromBounds = (
  id: string,
  min: Vector3,
  max: Vector3,
): GateFrameCollider | null => {
  const size = new Vector3().subVectors(max, min)
  if (size.x <= 0.01 || size.y <= 0.01 || size.z <= 0.01) return null

  const center = new Vector3().addVectors(min, max).multiplyScalar(0.5)
  return {
    id,
    // Rapier cuboids use half extents, so each side is half the measured size
    args: [size.x * 0.5, size.y * 0.5, size.z * 0.5],
    position: toTuple(center),
  }
}

// Builds the four solid frame walls around the door opening, so the ball bounces off the frame
const getGateFrameColliders = (
  frame: Object3D | undefined,
  topDoor: Object3D,
  bottomDoor: Object3D,
): GateFrameCollider[] => {
  if (!frame) return []

  const frameBox = getWorldBox(frame)
  // The doorway is the overlap between the frame box and the combined door box
  const doorBox = getWorldBox(topDoor).union(getWorldBox(bottomDoor))
  const openingMinX = Math.max(frameBox.min.x, doorBox.min.x)
  const openingMaxX = Math.min(frameBox.max.x, doorBox.max.x)
  const openingMinY = Math.max(frameBox.min.y, doorBox.min.y)
  const openingMaxY = Math.min(frameBox.max.y, doorBox.max.y)

  // Frame minus the doorway leaves a wall on each side, left/right of it and above/below
  const colliders = [
    boxColliderFromBounds(
      "left",
      frameBox.min,
      new Vector3(openingMinX, frameBox.max.y, frameBox.max.z),
    ),
    boxColliderFromBounds(
      "right",
      new Vector3(openingMaxX, frameBox.min.y, frameBox.min.z),
      frameBox.max,
    ),
    boxColliderFromBounds(
      "top",
      new Vector3(frameBox.min.x, openingMaxY, frameBox.min.z),
      frameBox.max,
    ),
    boxColliderFromBounds(
      "bottom",
      frameBox.min,
      new Vector3(frameBox.max.x, openingMinY, frameBox.max.z),
    ),
  ]

  return colliders.filter((collider): collider is GateFrameCollider => collider !== null)
}

// One-time setup from the model, cloning the doors and frame and working out their colliders and travel axis
const prepareGate = (nodes: PlayfieldNodes): PreparedGate | null => {
  const topSource = nodes.multiballGateDoors.find((mesh) => mesh.name === "door_top")
  const bottomSource = nodes.multiballGateDoors.find((mesh) => mesh.name === "door_bottom")
  if (!topSource || !bottomSource) return null

  const frame = nodes.multiballGateFrame[0]
    ? cloneAtWorldTransform(nodes.multiballGateFrame[0])
    : undefined
  const topDoor = cloneAtWorldTransform(topSource)
  const bottomDoor = cloneAtWorldTransform(bottomSource)
  const topClipPlane = getTopDoorClipPlane(topDoor, frame)
  let archBloomMaterials: EmissiveMaterial[] = []

  if (frame) {
    cloneMaterials(frame, undefined, {
      emissiveIntensity: MULTIBALL_GATE_ARCH_BLOOM_INTENSITY,
      emissiveColor: MULTIBALL_GATE_ARCH_OPEN_COLOR,
      shouldApply: isMultiballGateArchBloomMaterial,
    })
    archBloomMaterials = collectArchBloomMaterials(frame)
  }
  cloneMaterials(topDoor, topClipPlane)
  cloneMaterials(bottomDoor)

  // Combined size and center of both closed doors, used to size and position the blocking collider that seals the gap
  const localBox = getLocalObjectBox(topSource).union(getLocalObjectBox(bottomSource))
  const localCenter = localBox.getCenter(new Vector3())
  const localSize = localBox.getSize(new Vector3())
  const quat = topDoor.quaternion.clone()
  // Scale can be negative from mirrored model parts, take the absolute so sizes are always positive
  const absScale = new Vector3(
    Math.abs(topDoor.scale.x),
    Math.abs(topDoor.scale.y),
    Math.abs(topDoor.scale.z),
  )

  const colliderLocalCenter = localCenter.multiply(absScale)
  const colliderPosition = topDoor.position.clone().add(colliderLocalCenter.applyQuaternion(quat))
  const halfExtents = localSize.multiply(absScale).multiplyScalar(0.5)
  // Pad the collider a bit and keep a minimum thickness on X so a thin door still blocks the ball
  const colliderArgs: PositionType = [
    Math.max(halfExtents.x, 0.08),
    halfExtents.y + 0.04,
    halfExtents.z + 0.05,
  ]
  const colliderEuler = new Euler().setFromQuaternion(quat)
  // The direction the doors use to slide along when open
  const openAxis = new Vector3(0, 0, 1).applyQuaternion(quat).normalize()

  return {
    frame,
    topDoor,
    bottomDoor,
    topClosedPosition: topDoor.position.clone(),
    bottomClosedPosition: bottomDoor.position.clone(),
    openAxis,
    colliderArgs,
    colliderPosition: toTuple(colliderPosition),
    colliderRotation: [colliderEuler.x, colliderEuler.y, colliderEuler.z],
    frameColliders: getGateFrameColliders(frame, topDoor, bottomDoor),
    archBloomMaterials,
  }
}

// Places both doors at a given closed amount, then opens them along the Y axis as it drops toward 0
const applyGateAnimation = (gate: PreparedGate, closedAmount: number) => {
  const openAmount = 1 - closedAmount

  // The two doors push opposite ways from their closed spots, so the gap opens symmetrically
  gate.topDoor.position
    .copy(gate.topClosedPosition)
    .addScaledVector(gate.openAxis, MULTIBALL_GATE_OPEN_DISTANCE * openAmount)
  gate.bottomDoor.position
    .copy(gate.bottomClosedPosition)
    .addScaledVector(gate.openAxis, -MULTIBALL_GATE_OPEN_DISTANCE * openAmount)
}

// Drives the arch glow from open to closed, brightening it and tinting it toward the current ball color
const applyGateArchBloom = (gate: PreparedGate, closedAmount: number) => {
  // Blend the bloom strength from its open value up to its closed value as the gate shuts
  const intensity =
    MULTIBALL_GATE_ARCH_BLOOM_INTENSITY +
    (MULTIBALL_GATE_ARCH_CLOSED_BLOOM_INTENSITY - MULTIBALL_GATE_ARCH_BLOOM_INTENSITY) *
      closedAmount
  // The closed glow takes on whatever color the active ball is right now
  ARCH_CLOSED_COLOR.set(getCurrentBallColorSnapshot())

  for (const material of gate.archBloomMaterials) {
    material.emissive.lerpColors(ARCH_OPEN_COLOR, ARCH_CLOSED_COLOR, closedAmount)
    material.emissiveIntensity = intensity
    material.needsUpdate = true
  }
}

const PreparedMultiballGate = ({ gate }: { gate: PreparedGate }) => {
  const registerBonusHit = useBonusZoneHitRegistry()
  // Live gate state kept in a ref because it changes every frame and must not trigger React re-renders
  const gateStateRef = useRef(createOpenMultiballGateState())
  const colliderActiveRef = useRef(false)
  // Balls currently inside the sensor that we are watching to see if they cross the gate inward or not
  const pendingGateBallsRef = useRef(new Map<string, RapierRigidBody>())
  //This one needs a state to re-render, since the solid collider is mounted from it
  const [colliderActive, setColliderActive] = useState(false)

  // Only push a render when the collider actually toggles, not on every frame it stays the same
  const syncColliderActive = useCallback((active: boolean) => {
    if (colliderActiveRef.current === active) return
    colliderActiveRef.current = active
    setColliderActive(active)
  }, [])

  // Commits a new gate state, updating the ref, the collider flag, the door positions and the arch glow
  const syncGateState = useCallback(
    (state: MultiballGateState) => {
      gateStateRef.current = state
      syncColliderActive(state.colliderActive)
      applyGateAnimation(gate, state.closedAmount)
      applyGateArchBloom(gate, state.closedAmount)
    },
    [gate, syncColliderActive],
  )

  // Resets the gate to fully open whenever a new prepared gate comes in, clearing any tracked balls
  useLayoutEffect(() => {
    const openState = createOpenMultiballGateState()
    gateStateRef.current = openState
    colliderActiveRef.current = openState.colliderActive
    pendingGateBallsRef.current.clear()
    applyGateAnimation(gate, openState.closedAmount)
    applyGateArchBloom(gate, openState.closedAmount)
  }, [gate])

  // Slams the gate shut and stops watching pending balls, since one already made it through
  const closeGate = useCallback(
    (state: MultiballGateState, now: number) => {
      pendingGateBallsRef.current.clear()
      syncGateState(triggerMultiballGateClose(state, now))
    },
    [syncGateState],
  )

  // Advances the gate then closes it only if it ended up open, returns whether it was open in order to close it now
  const closeGateIfOpen = useCallback(
    (now: number): boolean => {
      const current = advanceMultiballGateState(gateStateRef.current, now)
      syncGateState(current)
      if (current.phase !== "open") return false

      closeGate(current, now)
      return true
    },
    [closeGate, syncGateState],
  )

  const handleSensorEnter = useCallback(
    (payload: CollisionPayload) => {
      if (!shouldTrackBallInSensor(payload)) return
      if (!payload.other.rigidBody) return

      const ballId = getBallId(payload.other.rigidBodyObject?.userData)
      if (!ballId) return

      const now = performance.now()
      const current = advanceMultiballGateState(gateStateRef.current, now)
      syncGateState(current)
      if (current.phase !== "open") return

      // It entered already past the gate and heading inward, so close right away
      if (
        shouldCloseMultiballGateFromSensorExit(
          payload.other.rigidBody.translation(),
          payload.other.rigidBody.linvel(),
        )
      ) {
        closeGate(current, now)
        return
      }

      // Otherwise just watch it, it may or may not cross the gate before leaving the sensor
      pendingGateBallsRef.current.set(ballId, payload.other.rigidBody)
    },
    [closeGate, syncGateState],
  )

  const handleSensorExit = useCallback(
    (payload: CollisionPayload) => {
      const ballId = getBallId(payload.other.rigidBodyObject?.userData)
      if (!ballId) return

      const body = payload.other.rigidBody
      // If it left past the gate still heading inward, close behind it and stop tracking
      if (
        body &&
        shouldCloseMultiballGateFromSensorExit(body.translation(), body.linvel()) &&
        closeGateIfOpen(performance.now())
      ) {
        return
      }

      pendingGateBallsRef.current.delete(ballId)
    },
    [closeGateIfOpen],
  )

  // The ball hit the solid gate while it was closed, count it as a bonus zone bounce
  const handleGateCollision = useCallback(
    ({ other }: CollisionEnterPayload) => {
      if (other.rigidBodyObject?.name !== "ball") return

      const ballId = getBallId(other.rigidBodyObject.userData)
      if (!ballId) return

      const position = other.rigidBody?.translation()
      registerBonusHit(
        ballId,
        position ? { x: position.x, y: position.y, z: position.z } : undefined,
      )
    },
    [registerBonusHit],
  )

  useFrame(() => {
    const now = performance.now()
    let next = advanceMultiballGateState(gateStateRef.current, now)

    // While the gate is open, watch the tracked balls to catch the moment one crosses inward
    if (next.phase === "open" && pendingGateBallsRef.current.size > 0) {
      // Forget any tracked ball that no longer exists, for instance one that drained
      const trackableBallIds = new Set(useBallStore.getState().balls.map((ball) => ball.id))
      for (const ballId of pendingGateBallsRef.current.keys()) {
        if (!trackableBallIds.has(ballId)) pendingGateBallsRef.current.delete(ballId)
      }

      // The first tracked ball past the gate and still heading inward triggers the close
      for (const body of pendingGateBallsRef.current.values()) {
        if (
          hasClearedMultiballGate(body.translation()) &&
          isMultiballGateClosingVelocity(body.linvel())
        ) {
          pendingGateBallsRef.current.clear()
          next = triggerMultiballGateClose(next, now)
          break
        }
      }
    }

    syncGateState(next)
  })

  return (
    <>
      {gate.frame && <primitive object={gate.frame} />}
      <primitive object={gate.bottomDoor} />
      <primitive object={gate.topDoor} />
      <RigidBody type="fixed" colliders={false}>
        {/* The four solid walls around the doorway, always present so the ball bounces off the frame */}
        {gate.frameColliders.map((collider) => (
          <CuboidCollider
            key={collider.id}
            name={`multiball-gate-frame-${collider.id}`}
            args={collider.args}
            position={collider.position}
            restitution={BONUS_ZONE_RESTITUTION}
            friction={0}
          />
        ))}

        {/* Sensor in front of the gate, it only detects passing balls and never blocks them */}
        <CuboidCollider
          sensor
          name="multiball-gate-sensor"
          args={MULTIBALL_GATE_HALF_EXTENTS}
          position={MULTIBALL_GATE_POSITION}
          rotation={gate.colliderRotation}
          onIntersectionEnter={handleSensorEnter}
          onIntersectionExit={handleSensorExit}
        />

        {/* The solid blocking collider exists only while the gate is closing or closed */}
        {colliderActive && (
          <CuboidCollider
            name="multiball-gate"
            args={gate.colliderArgs}
            position={gate.colliderPosition}
            rotation={gate.colliderRotation}
            restitution={BONUS_ZONE_RESTITUTION}
            friction={0}
            onCollisionEnter={handleGateCollision}
          />
        )}
      </RigidBody>
    </>
  )
}

const MultiballGate = ({ nodes }: { nodes: PlayfieldNodes }) => {
  const gate = useMemo(() => prepareGate(nodes), [nodes])
  if (!gate) return null

  // Key on the door uuid so a fresh gate remounts the inner component with clean refs
  return <PreparedMultiballGate key={gate.topDoor.uuid} gate={gate} />
}

export default MultiballGate
