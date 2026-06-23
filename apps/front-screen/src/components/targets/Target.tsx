import useTargetStore from "@/stores/useTargetStore"
import { playRandomSfx } from "@/audio/soundEngine"
import { useFrame } from "@react-three/fiber"
import { RigidBody, type CollisionEnterPayload, type RapierRigidBody } from "@react-three/rapier"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { Box3, MathUtils, Quaternion, Vector3, type Mesh } from "three"
import { cloneWithWorldOrientation } from "../playfield/usePlayfieldModel"
import useScreenShakeStore from "@/stores/useScreenShakeStore"
import { SHAKE_INTENSITY } from "@/components/screenShake/screenShakeConfig"
import { emitParticleBurst } from "../vfx/particleBurstQueue"
import { easeOutCubic } from "@/utils/easing"
import { setBodyCollidersEnabled } from "../physics/rigidBodyColliders"

interface TargetProps {
  mesh: Mesh
  worldPosition: [number, number, number]
}

const STANDUP_ANGLE = Math.PI / 4
const STANDUP_DURATION = 220
const STANDUP_RETURN_DURATION = 180
const DROP_TARGET_DURATION = 140
export const DROP_TARGET_RETURN_DURATION = 220
const DROP_TARGET_VISIBLE_HEIGHT = 0.08
const DROP_TARGET_MIN_DROP_RATIO = 0.75

const hashName = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

const getTiltAxis = (name: string) => {
  const hash = hashName(name)
  const xAmount = 0.35 + ((hash % 100) / 100) * 0.65
  const zAmount = 0.25 + (((hash >> 8) % 100) / 100) * 0.75
  const zSign = hash % 2 === 0 ? 1 : -1
  return new Vector3(xAmount, 0, zAmount * zSign).normalize()
}

const Target = ({ mesh, worldPosition }: TargetProps) => {
  const bodyRef = useRef<RapierRigidBody>(null)
  const collidersEnabledRef = useRef<boolean | null>(null)
  const currentYOffsetRef = useRef(0)
  const resetStartYOffsetRef = useRef(0)
  const resetStartedAtRef = useRef<number | null>(null)
  const isStandup = mesh.name.includes("_standup")
  const isActivated = useTargetStore((state) => state.activatedTargetIds.includes(mesh.name))
  const previousActivatedRef = useRef(isActivated)
  const hitTime = useRef<number | null>(null)
  const tiltAxis = useMemo(() => getTiltAxis(mesh.name), [mesh.name])
  const rotationRef = useRef(new Quaternion())

  const clone = useMemo(() => cloneWithWorldOrientation(mesh), [mesh])
  const dropDistance = useMemo(() => {
    const size = new Vector3()
    new Box3().setFromObject(clone).getSize(size)
    return Math.max(size.y - DROP_TARGET_VISIBLE_HEIGHT, size.y * DROP_TARGET_MIN_DROP_RATIO)
  }, [clone])

  const setCollidersEnabled = useCallback((enabled: boolean) => {
    if (!bodyRef.current || collidersEnabledRef.current === enabled) return
    setBodyCollidersEnabled(bodyRef.current, enabled)
    collidersEnabledRef.current = enabled
  }, [])

  useEffect(() => {
    if (isStandup) return

    const wasActivated = previousActivatedRef.current

    if (!isActivated) {
      if (wasActivated) {
        hitTime.current = null
        resetStartedAtRef.current = performance.now()
        resetStartYOffsetRef.current =
          currentYOffsetRef.current > 0 ? currentYOffsetRef.current : dropDistance
        setCollidersEnabled(false)
      } else if (resetStartedAtRef.current === null) {
        setCollidersEnabled(true)
      }
    } else {
      resetStartedAtRef.current = null
      setCollidersEnabled(false)
    }

    previousActivatedRef.current = isActivated
  }, [dropDistance, isActivated, isStandup, setCollidersEnabled])

  const handleCollision = useCallback(
    ({ other }: CollisionEnterPayload) => {
      if (other.rigidBodyObject?.name !== "ball") return

      const ballPos = other.rigidBody?.translation()
      // Falls back to the target world position to ensure payloads without a rigid body can emit a burst.
      const burstPosition = ballPos ?? {
        x: worldPosition[0],
        y: worldPosition[1],
        z: worldPosition[2],
      }

      if (isStandup) {
        useTargetStore.getState().recordTargetHit(mesh.name)
        playRandomSfx("targets")
        useScreenShakeStore.getState().addTrauma(SHAKE_INTENSITY.targetStandup)
        emitParticleBurst({ kind: "target", position: burstPosition, intensity: 0.85 })
        hitTime.current = performance.now()
        return
      }

      const targetStore = useTargetStore.getState()
      if (targetStore.activatedTargetIds.includes(mesh.name)) return

      targetStore.recordTargetHit(mesh.name)
      playRandomSfx("targets")
      useScreenShakeStore.getState().addTrauma(SHAKE_INTENSITY.targetDrop)
      emitParticleBurst({ kind: "target", position: burstPosition })
      resetStartedAtRef.current = null
      hitTime.current = performance.now()
      setCollidersEnabled(false)
      targetStore.activateTarget(mesh.name)
    },
    [mesh.name, isStandup, setCollidersEnabled, worldPosition],
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
        setCollidersEnabled(false)
      }
    } else if (resetStartedAtRef.current !== null) {
      const elapsed = performance.now() - resetStartedAtRef.current
      const progress = MathUtils.clamp(elapsed / DROP_TARGET_RETURN_DURATION, 0, 1)
      yOffset = resetStartYOffsetRef.current * (1 - easeOutCubic(progress))

      if (progress >= 1) {
        yOffset = 0
        resetStartedAtRef.current = null
        setCollidersEnabled(true)
      }
    }

    currentYOffsetRef.current = yOffset
    rotationRef.current.setFromAxisAngle(tiltAxis, angle)
    bodyRef.current.setNextKinematicTranslation({ x, y: y - yOffset, z })
    bodyRef.current.setNextKinematicRotation(rotationRef.current)
  })

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders="hull"
      position={worldPosition}
      onCollisionEnter={handleCollision}
    >
      <primitive object={clone} />
    </RigidBody>
  )
}

export default Target
