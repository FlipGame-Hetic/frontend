import useTargetStore from "@/stores/useTargetStore"
import { broadcastEvent } from "@frontend/ws"
import { useFrame } from "@react-three/fiber"
import { RigidBody, type CollisionEnterPayload, type RapierRigidBody } from "@react-three/rapier"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { Box3, MathUtils, Quaternion, Vector3, type Mesh } from "three"
import { cloneWithWorldOrientation } from "../playfield/usePlayfieldModel"

interface TargetProps {
  mesh: Mesh
  worldPosition: [number, number, number]
}

const STANDUP_ANGLE = Math.PI / 4
const STANDUP_DURATION = 220
const STANDUP_RETURN_DURATION = 180
const DROP_TARGET_DURATION = 140
const DROP_TARGET_VISIBLE_HEIGHT = 0.08
const DROP_TARGET_MIN_DROP_RATIO = 0.75

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

function hashName(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function getTiltAxis(name: string) {
  const hash = hashName(name)
  const xAmount = 0.35 + ((hash % 100) / 100) * 0.65
  const zAmount = 0.25 + (((hash >> 8) % 100) / 100) * 0.75
  const zSign = hash % 2 === 0 ? 1 : -1
  return new Vector3(xAmount, 0, zAmount * zSign).normalize()
}

function setTargetCollidersEnabled(body: RapierRigidBody | null, enabled: boolean) {
  if (!body) return
  for (let i = 0; i < body.numColliders(); i += 1) {
    body.collider(i).setEnabled(enabled)
  }
}

const Target = ({ mesh, worldPosition }: TargetProps) => {
  const bodyRef = useRef<RapierRigidBody>(null)
  const isStandup = mesh.name.includes("_standup")
  const isActivated = useTargetStore((state) => state.activatedTargetIds.includes(mesh.name))
  const hitTime = useRef<number | null>(null)
  const tiltAxis = useMemo(() => getTiltAxis(mesh.name), [mesh.name])
  const rotationRef = useRef(new Quaternion())

  const clone = useMemo(() => cloneWithWorldOrientation(mesh), [mesh])
  const dropDistance = useMemo(() => {
    const size = new Vector3()
    new Box3().setFromObject(clone).getSize(size)
    return Math.max(size.y - DROP_TARGET_VISIBLE_HEIGHT, size.y * DROP_TARGET_MIN_DROP_RATIO)
  }, [clone])

  useEffect(() => {
    if (isStandup) return
    setTargetCollidersEnabled(bodyRef.current, !isActivated)
  }, [isActivated, isStandup])

  const handleCollision = useCallback(
    ({ other }: CollisionEnterPayload) => {
      if (other.rigidBodyObject?.name !== "ball") return
      useTargetStore.getState().recordTargetHit(mesh.name)
      broadcastEvent({ event_type: "target_hit", payload: { target_id: mesh.name } })

      if (isStandup) {
        hitTime.current = performance.now()
      } else if (!useTargetStore.getState().activatedTargetIds.includes(mesh.name)) {
        setTargetCollidersEnabled(bodyRef.current, false)
        useTargetStore.getState().activateTarget(mesh.name)
        hitTime.current = performance.now()
      }
    },
    [mesh.name, isStandup],
  )

  useFrame(() => {
    if (!bodyRef.current) return
    const [x, y, z] = worldPosition
    let angle = 0
    let yOffset = 0

    if (isStandup) {
      if (hitTime.current !== null) {
        const elapsed = performance.now() - hitTime.current
        if (elapsed < STANDUP_DURATION + STANDUP_RETURN_DURATION) {
          if (elapsed < STANDUP_DURATION) {
            angle = STANDUP_ANGLE * easeOutCubic(elapsed / STANDUP_DURATION)
          } else {
            const returnProgress = (elapsed - STANDUP_DURATION) / STANDUP_RETURN_DURATION
            angle = STANDUP_ANGLE * (1 - easeOutCubic(returnProgress))
          }
        } else {
          hitTime.current = null
        }
      }
    } else if (isActivated) {
      const elapsed =
        hitTime.current === null ? DROP_TARGET_DURATION : performance.now() - hitTime.current
      const progress = MathUtils.clamp(elapsed / DROP_TARGET_DURATION, 0, 1)
      yOffset = dropDistance * easeOutCubic(progress)
      if (progress >= 1) {
        hitTime.current = null
      }
    }

    rotationRef.current.setFromAxisAngle(tiltAxis, angle)
    bodyRef.current.setNextKinematicTranslation({ x, y: y - yOffset, z })
    bodyRef.current.setNextKinematicRotation(rotationRef.current)
  })

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders="trimesh"
      position={worldPosition}
      onCollisionEnter={handleCollision}
    >
      <primitive object={clone} />
    </RigidBody>
  )
}

export default Target
