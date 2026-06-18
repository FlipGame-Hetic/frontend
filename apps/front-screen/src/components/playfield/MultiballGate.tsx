import { getBallId, getCurrentBallColor } from "@/components/balls/ballUserData"
import type { PositionType } from "@/types/worldTypes"
import { useFrame } from "@react-three/fiber"
import type { CollisionEnterPayload, CollisionPayload, RapierRigidBody } from "@react-three/rapier"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { Material, Object3D } from "three"
import { Box3, Color, Euler, Matrix4, Mesh, Plane, Vector3 } from "three"
import {
  BONUS_ZONE_RESTITUTION,
  MULTIBALL_GATE_ARCH_BLOOM_INTENSITY,
  MULTIBALL_GATE_ARCH_CLOSED_BLOOM_INTENSITY,
  MULTIBALL_GATE_ARCH_OPEN_COLOR,
  MULTIBALL_GATE_HALF_EXTENTS,
  MULTIBALL_GATE_OPEN_DISTANCE,
  MULTIBALL_GATE_POSITION,
} from "./bonusZoneConfig"
import { useBonusZoneHitRegistrar } from "./bonusZoneHits"
import {
  advanceMultiballGateState,
  createOpenMultiballGateState,
  hasClearedMultiballGate,
  isMultiballGateClosingVelocity,
  shouldCloseMultiballGateFromSensorExit,
  shouldTrackMultiballGateSensorBall,
  triggerMultiballGateClose,
} from "./multiballGateRuntime"
import {
  cloneMaterialWithBloom,
  hasEmissiveControls,
  type BloomMaterialOptions,
  type EmissiveMaterial,
} from "./playfieldBloomMaterials"
import { cloneAtWorldTransform, type PlayfieldNodes } from "./usePlayfieldModel"

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
const ARCH_CLOSED_COLOR = new Color()

const isMultiballGateArchBloomMaterial = (material: Material): boolean => {
  return material.name === "softbluelight"
}

const clonePlainMaterial = (material: Material | Material[]) => {
  return Array.isArray(material) ? material.map((m) => m.clone()) : material.clone()
}

const applyClippingPlane = (material: Material | Material[], clippingPlane?: Plane) => {
  if (!clippingPlane) return
  const materials = Array.isArray(material) ? material : [material]
  for (const m of materials) {
    m.clippingPlanes = [clippingPlane]
    m.needsUpdate = true
  }
}

const cloneMaterial = (
  material: Material | Material[],
  clippingPlane?: Plane,
  bloomOptions?: BloomMaterialOptions,
) => {
  const cloned = bloomOptions
    ? cloneMaterialWithBloom(material, bloomOptions)
    : clonePlainMaterial(material)
  applyClippingPlane(cloned, clippingPlane)
  return cloned
}

const isMesh = (node: Object3D): node is Mesh => {
  return node instanceof Mesh
}

const cloneMaterials = (
  object: Object3D,
  clippingPlane?: Plane,
  bloomOptions?: BloomMaterialOptions,
) => {
  object.traverse((node) => {
    if (!isMesh(node)) return
    node.material = cloneMaterial(node.material, clippingPlane, bloomOptions)
  })
}

const collectArchBloomMaterials = (object: Object3D): EmissiveMaterial[] => {
  const materials: EmissiveMaterial[] = []

  object.traverse((node) => {
    if (!isMesh(node)) return
    const nodeMaterials = Array.isArray(node.material) ? node.material : [node.material]
    for (const material of nodeMaterials) {
      if (!isMultiballGateArchBloomMaterial(material)) continue
      if (!hasEmissiveControls(material)) continue
      materials.push(material)
    }
  })

  return materials
}

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
    const nodeToRoot = new Matrix4().multiplyMatrices(rootInverse, node.matrixWorld)
    box.union(geometryBox.clone().applyMatrix4(nodeToRoot))
  })

  return box
}

const getWorldBox = (object: Object3D): Box3 => {
  object.updateWorldMatrix(true, false)
  return new Box3().setFromObject(object)
}

const getTopDoorClipPlane = (topDoor: Object3D, frame: Object3D | undefined): Plane => {
  const topDoorBox = getWorldBox(topDoor)
  const frameBox = frame ? getWorldBox(frame) : null
  const frameTopY = frameBox?.max.y ?? topDoorBox.max.y + 0.12
  const clipY = topDoorBox.max.y + (frameTopY - topDoorBox.max.y) * 0.5

  return new Plane(new Vector3(0, -1, 0), clipY)
}

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
    args: [size.x * 0.5, size.y * 0.5, size.z * 0.5],
    position: toTuple(center),
  }
}

const getGateFrameColliders = (
  frame: Object3D | undefined,
  topDoor: Object3D,
  bottomDoor: Object3D,
): GateFrameCollider[] => {
  if (!frame) return []

  const frameBox = getWorldBox(frame)
  const doorBox = getWorldBox(topDoor).union(getWorldBox(bottomDoor))
  const openingMinX = Math.max(frameBox.min.x, doorBox.min.x)
  const openingMaxX = Math.min(frameBox.max.x, doorBox.max.x)
  const openingMinY = Math.max(frameBox.min.y, doorBox.min.y)
  const openingMaxY = Math.min(frameBox.max.y, doorBox.max.y)
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

  const localBox = getLocalObjectBox(topSource).union(getLocalObjectBox(bottomSource))
  const localCenter = localBox.getCenter(new Vector3())
  const localSize = localBox.getSize(new Vector3())
  const quat = topDoor.quaternion.clone()
  const absScale = new Vector3(
    Math.abs(topDoor.scale.x),
    Math.abs(topDoor.scale.y),
    Math.abs(topDoor.scale.z),
  )

  const colliderLocalCenter = localCenter.multiply(absScale)
  const colliderPosition = topDoor.position.clone().add(colliderLocalCenter.applyQuaternion(quat))
  const halfExtents = localSize.multiply(absScale).multiplyScalar(0.5)
  const colliderArgs: PositionType = [
    Math.max(halfExtents.x, 0.08),
    halfExtents.y + 0.04,
    halfExtents.z + 0.05,
  ]
  const colliderEuler = new Euler().setFromQuaternion(quat)
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

const applyGateAnimation = (gate: PreparedGate, closedAmount: number) => {
  const openAmount = 1 - closedAmount
  gate.topDoor.position
    .copy(gate.topClosedPosition)
    .addScaledVector(gate.openAxis, MULTIBALL_GATE_OPEN_DISTANCE * openAmount)
  gate.bottomDoor.position
    .copy(gate.bottomClosedPosition)
    .addScaledVector(gate.openAxis, -MULTIBALL_GATE_OPEN_DISTANCE * openAmount)
}

const applyGateArchBloom = (gate: PreparedGate, closedAmount: number) => {
  const intensity =
    MULTIBALL_GATE_ARCH_BLOOM_INTENSITY +
    (MULTIBALL_GATE_ARCH_CLOSED_BLOOM_INTENSITY - MULTIBALL_GATE_ARCH_BLOOM_INTENSITY) *
      closedAmount
  ARCH_CLOSED_COLOR.set(getCurrentBallColor())

  for (const material of gate.archBloomMaterials) {
    material.emissive.lerpColors(ARCH_OPEN_COLOR, ARCH_CLOSED_COLOR, closedAmount)
    material.emissiveIntensity = intensity
    material.needsUpdate = true
  }
}

const PreparedMultiballGate = ({ gate }: { gate: PreparedGate }) => {
  const registerBonusHit = useBonusZoneHitRegistrar()
  const gateStateRef = useRef(createOpenMultiballGateState())
  const colliderActiveRef = useRef(false)
  const pendingGateBallsRef = useRef(new Map<string, RapierRigidBody>())
  const [colliderActive, setColliderActive] = useState(false)

  const syncColliderActive = useCallback((active: boolean) => {
    if (colliderActiveRef.current === active) return
    colliderActiveRef.current = active
    setColliderActive(active)
  }, [])

  const syncGateState = useCallback(
    (state: ReturnType<typeof createOpenMultiballGateState>) => {
      gateStateRef.current = state
      syncColliderActive(state.colliderActive)
      applyGateAnimation(gate, state.closedAmount)
      applyGateArchBloom(gate, state.closedAmount)
    },
    [gate, syncColliderActive],
  )

  useLayoutEffect(() => {
    const openState = createOpenMultiballGateState()
    gateStateRef.current = openState
    colliderActiveRef.current = openState.colliderActive
    pendingGateBallsRef.current.clear()
    applyGateAnimation(gate, openState.closedAmount)
    applyGateArchBloom(gate, openState.closedAmount)
  }, [gate])

  const closeGateIfOpen = useCallback(
    (now: number): boolean => {
      const current = advanceMultiballGateState(gateStateRef.current, now)
      syncGateState(current)
      if (current.phase !== "open") return false

      pendingGateBallsRef.current.clear()
      syncGateState(triggerMultiballGateClose(current, now))
      return true
    },
    [syncGateState],
  )

  const handleSensorEnter = useCallback(
    (payload: CollisionPayload) => {
      if (!shouldTrackMultiballGateSensorBall(payload)) return
      if (!payload.other.rigidBody) return

      const ballId = getBallId(payload.other.rigidBodyObject?.userData)
      if (!ballId) return

      const now = performance.now()
      const current = advanceMultiballGateState(gateStateRef.current, now)
      syncGateState(current)
      if (current.phase !== "open") return

      if (
        shouldCloseMultiballGateFromSensorExit(
          payload.other.rigidBody.translation(),
          payload.other.rigidBody.linvel(),
        )
      ) {
        pendingGateBallsRef.current.clear()
        syncGateState(triggerMultiballGateClose(current, now))
        return
      }

      pendingGateBallsRef.current.set(ballId, payload.other.rigidBody)
    },
    [syncGateState],
  )

  const handleSensorExit = useCallback(
    (payload: CollisionPayload) => {
      const ballId = getBallId(payload.other.rigidBodyObject?.userData)
      if (!ballId) return

      const body = payload.other.rigidBody
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

    if (next.phase === "open" && pendingGateBallsRef.current.size > 0) {
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
        <CuboidCollider
          sensor
          name="multiball-gate-sensor"
          args={MULTIBALL_GATE_HALF_EXTENTS}
          position={MULTIBALL_GATE_POSITION}
          rotation={gate.colliderRotation}
          onIntersectionEnter={handleSensorEnter}
          onIntersectionExit={handleSensorExit}
        />
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

  return <PreparedMultiballGate key={gate.topDoor.uuid} gate={gate} />
}

export default MultiballGate
