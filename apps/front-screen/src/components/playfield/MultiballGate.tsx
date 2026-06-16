import { useFrame } from "@react-three/fiber"
import type { CollisionEnterPayload, CollisionPayload } from "@react-three/rapier"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { Material, Mesh } from "three"
import { Box3, Euler, Plane, Vector3 } from "three"
import { getBallId } from "@/components/balls/ballUserData"
import type { PositionType } from "@/types/worldTypes"
import { BONUS_ZONE_RESTITUTION, MULTIBALL_GATE_OPEN_DISTANCE } from "./bonusZoneConfig"
import { useBonusZoneHitRegistrar } from "./bonusZoneHits"
import {
  advanceMultiballGateState,
  createOpenMultiballGateState,
  shouldCloseMultiballGateFromSensor,
  triggerMultiballGateClose,
} from "./multiballGateRuntime"
import { cloneAtWorldTransform, type PlayfieldNodes } from "./usePlayfieldModel"

interface PreparedGate {
  frame?: Mesh
  topDoor: Mesh
  bottomDoor: Mesh
  topClosedPosition: Vector3
  bottomClosedPosition: Vector3
  openAxis: Vector3
  colliderArgs: PositionType
  sensorArgs: PositionType
  colliderPosition: PositionType
  colliderRotation: PositionType
  frameColliders: GateFrameCollider[]
}

interface GateFrameCollider {
  id: string
  args: PositionType
  position: PositionType
}

const toTuple = (v: Vector3): PositionType => [v.x, v.y, v.z]

const cloneMaterial = (material: Material | Material[], clippingPlane?: Plane) => {
  const cloneOne = (m: Material) => {
    const cloned = m.clone()
    if (clippingPlane) {
      cloned.clippingPlanes = [clippingPlane]
      cloned.needsUpdate = true
    }
    return cloned
  }

  return Array.isArray(material) ? material.map(cloneOne) : cloneOne(material)
}

const getGeometryBox = (mesh: Mesh): Box3 => {
  mesh.geometry.computeBoundingBox()
  const box = mesh.geometry.boundingBox
  if (!box) return new Box3()
  return box.clone()
}

const getWorldBox = (mesh: Mesh): Box3 => {
  mesh.updateWorldMatrix(true, false)
  return new Box3().setFromObject(mesh)
}

const getTopDoorClipPlane = (topDoor: Mesh, frame: Mesh | undefined): Plane => {
  const topDoorBox = getWorldBox(topDoor)
  const frameBox = frame ? getWorldBox(frame) : null
  const frameTopY = frameBox?.max.y ?? topDoorBox.max.y + 0.12
  const clipY = topDoorBox.max.y + (frameTopY - topDoorBox.max.y) * 0.5

  return new Plane(new Vector3(0, 1, 0), -clipY)
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
  frame: Mesh | undefined,
  topDoor: Mesh,
  bottomDoor: Mesh,
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

  topDoor.material = cloneMaterial(topDoor.material, topClipPlane)
  bottomDoor.material = cloneMaterial(bottomDoor.material)

  const localBox = getGeometryBox(topSource).union(getGeometryBox(bottomSource))
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
  const sensorArgs: PositionType = [
    colliderArgs[0] + 0.1,
    colliderArgs[1] + 0.12,
    colliderArgs[2] + 0.12,
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
    sensorArgs,
    colliderPosition: toTuple(colliderPosition),
    colliderRotation: [colliderEuler.x, colliderEuler.y, colliderEuler.z],
    frameColliders: getGateFrameColliders(frame, topDoor, bottomDoor),
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

const PreparedMultiballGate = ({ gate }: { gate: PreparedGate }) => {
  const registerBonusHit = useBonusZoneHitRegistrar()
  const gateStateRef = useRef(createOpenMultiballGateState())
  const colliderActiveRef = useRef(false)
  const [colliderActive, setColliderActive] = useState(false)

  const syncColliderActive = useCallback((active: boolean) => {
    if (colliderActiveRef.current === active) return
    colliderActiveRef.current = active
    setColliderActive(active)
  }, [])

  useLayoutEffect(() => {
    gateStateRef.current = createOpenMultiballGateState()
    colliderActiveRef.current = false
    applyGateAnimation(gate, 0)
  }, [gate])

  const handleSensorEnter = useCallback(
    (payload: CollisionPayload) => {
      if (!shouldCloseMultiballGateFromSensor(payload)) return

      const now = performance.now()
      const current = advanceMultiballGateState(gateStateRef.current, now)
      const next = triggerMultiballGateClose(current, now)
      gateStateRef.current = next
      syncColliderActive(next.colliderActive)
      applyGateAnimation(gate, next.closedAmount)
    },
    [gate, syncColliderActive],
  )

  const handleGateCollision = useCallback(
    ({ other }: CollisionEnterPayload) => {
      if (other.rigidBodyObject?.name !== "ball") return
      const ballId = getBallId(other.rigidBodyObject.userData)
      if (!ballId) return
      registerBonusHit(ballId)
    },
    [registerBonusHit],
  )

  useFrame(() => {
    const next = advanceMultiballGateState(gateStateRef.current, performance.now())
    gateStateRef.current = next
    syncColliderActive(next.colliderActive)
    applyGateAnimation(gate, next.closedAmount)
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
          args={gate.sensorArgs}
          position={gate.colliderPosition}
          rotation={gate.colliderRotation}
          onIntersectionEnter={handleSensorEnter}
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
