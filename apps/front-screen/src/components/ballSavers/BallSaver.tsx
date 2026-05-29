import useTargetStore from "@/stores/useTargetStore"
import { playSfx } from "@/audio/soundEngine"
import type { PositionType } from "@/types/worldTypes"
import { useFrame } from "@react-three/fiber"
import {
  RigidBody,
  type CollisionEnterPayload,
  type CollisionExitPayload,
  type RapierRigidBody,
} from "@react-three/rapier"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { Box3, MathUtils, type Mesh, Vector3 } from "three"
import { hasBallId } from "@/components/balls/ballUserData"
import { cloneWithWorldOrientation } from "../playfield/usePlayfieldModel"
import {
  areBallSaverTargetsDown,
  BALL_SAVER_COOLDOWN_MS,
  BALL_SAVER_MIN_CONTACT_DURATION_MS,
  BALL_SAVER_MIN_DROP_RATIO,
  BALL_SAVER_POST_EXIT_DELAY_MS,
  BALL_SAVER_RAISE_DURATION_MS,
  BALL_SAVER_RETRACT_DURATION_MS,
  BALL_SAVER_TARGET_IDS,
  BALL_SAVER_VISIBLE_HEIGHT,
  type BallSaverSide,
} from "./ballSaverConfig"

interface BallSaverProps {
  mesh: Mesh
  side: BallSaverSide
  worldPosition: PositionType
}

type BallSaverPhase = "down" | "rising" | "active" | "retracting" | "cooldown"
type BallCollisionTarget = CollisionEnterPayload["other"]

const easeOutCubic = (t: number) => {
  return 1 - (1 - t) ** 3
}

const setBodyCollidersEnabled = (body: RapierRigidBody | null, enabled: boolean) => {
  if (!body) return
  for (let i = 0; i < body.numColliders(); i += 1) {
    body.collider(i).setEnabled(enabled)
  }
}

const getBallCollisionKey = (other: BallCollisionTarget): string | null => {
  if (other.rigidBodyObject?.name !== "ball") return null

  if (hasBallId(other.rigidBodyObject.userData)) {
    return `ball:${other.rigidBodyObject.userData.ballId}`
  }

  const handle = other.rigidBody?.handle
  if (typeof handle === "number" || typeof handle === "string") {
    return `body:${String(handle)}`
  }

  return `object:${other.rigidBodyObject.uuid}`
}

const BallSaver = ({ mesh, side, worldPosition }: BallSaverProps) => {
  const bodyRef = useRef<RapierRigidBody>(null)
  const collidersEnabledRef = useRef<boolean | null>(null)
  const activeContactsRef = useRef(new Set<string>())
  const pendingConsumeAtRef = useRef<number | null>(null)
  const firstContactAtRef = useRef<number | null>(null)
  const lastExitAtRef = useRef<number | null>(null)
  const currentYOffsetRef = useRef(0)
  const retractStartYOffsetRef = useRef(0)
  const phaseStartedAtRef = useRef(0)
  const phaseRef = useRef<BallSaverPhase>("down")

  const targetsDown = useTargetStore((state) =>
    areBallSaverTargetsDown(side, state.activatedTargetIds),
  )

  const clone = useMemo(() => cloneWithWorldOrientation(mesh), [mesh])
  const dropDistance = useMemo(() => {
    const size = new Vector3()
    new Box3().setFromObject(clone).getSize(size)
    return Math.max(size.y - BALL_SAVER_VISIBLE_HEIGHT, size.y * BALL_SAVER_MIN_DROP_RATIO)
  }, [clone])

  const setPhase = useCallback((nextPhase: BallSaverPhase, now = performance.now()) => {
    phaseRef.current = nextPhase
    phaseStartedAtRef.current = now
  }, [])

  const setCollidersEnabled = useCallback((enabled: boolean) => {
    if (!bodyRef.current || collidersEnabledRef.current === enabled) return
    setBodyCollidersEnabled(bodyRef.current, enabled)
    collidersEnabledRef.current = enabled
  }, [])

  const resetSideTargets = useCallback(() => {
    const targetStore = useTargetStore.getState()
    BALL_SAVER_TARGET_IDS[side].forEach((targetId) => {
      targetStore.resetTarget(targetId)
    })
  }, [side])

  const consumeProtection = useCallback(
    (now = performance.now()) => {
      if (phaseRef.current !== "active") return

      pendingConsumeAtRef.current = null
      firstContactAtRef.current = null
      lastExitAtRef.current = null
      activeContactsRef.current.clear()
      retractStartYOffsetRef.current = currentYOffsetRef.current
      setCollidersEnabled(false)
      setPhase("retracting", now)
    },
    [setCollidersEnabled, setPhase],
  )

  useEffect(() => {
    if (targetsDown) {
      if (phaseRef.current === "down") {
        setCollidersEnabled(false)
        setPhase("rising")
        playSfx("ballsaver_up")
      }
      return
    }

    if (phaseRef.current !== "down") {
      activeContactsRef.current.clear()
      pendingConsumeAtRef.current = null
      firstContactAtRef.current = null
      lastExitAtRef.current = null
      setCollidersEnabled(false)
      setPhase("down")
    } else {
      setCollidersEnabled(false)
    }
  }, [targetsDown, setCollidersEnabled, setPhase])

  const handleCollisionEnter = useCallback(({ other }: CollisionEnterPayload) => {
    const key = getBallCollisionKey(other)
    if (!key || phaseRef.current !== "active") return

    if (activeContactsRef.current.size === 0) {
      firstContactAtRef.current = performance.now()
    }
    activeContactsRef.current.add(key)
    pendingConsumeAtRef.current = null
  }, [])

  const handleCollisionExit = useCallback(({ other }: CollisionExitPayload) => {
    const key = getBallCollisionKey(other)
    if (!key || phaseRef.current !== "active") return
    if (!activeContactsRef.current.delete(key)) return

    if (activeContactsRef.current.size === 0) {
      lastExitAtRef.current = performance.now()
      pendingConsumeAtRef.current = performance.now() + BALL_SAVER_POST_EXIT_DELAY_MS
    }
  }, [])

  useFrame(() => {
    const body = bodyRef.current
    if (!body) return

    const now = performance.now()

    if (
      phaseRef.current === "active" &&
      pendingConsumeAtRef.current !== null &&
      now >= pendingConsumeAtRef.current
    ) {
      const contactDuration = (lastExitAtRef.current ?? now) - (firstContactAtRef.current ?? now)
      if (contactDuration >= BALL_SAVER_MIN_CONTACT_DURATION_MS) {
        consumeProtection(now)
      } else {
        pendingConsumeAtRef.current = null
        firstContactAtRef.current = null
        lastExitAtRef.current = null
      }
    }

    let yOffset = dropDistance
    const elapsed = now - phaseStartedAtRef.current

    if (phaseRef.current === "rising") {
      const progress = MathUtils.clamp(elapsed / BALL_SAVER_RAISE_DURATION_MS, 0, 1)
      yOffset = dropDistance * (1 - easeOutCubic(progress))

      if (progress >= 1) {
        yOffset = 0
        currentYOffsetRef.current = yOffset
        setPhase("active", now)
        setCollidersEnabled(true)
      }
    } else if (phaseRef.current === "active") {
      yOffset = 0
    } else if (phaseRef.current === "retracting") {
      const progress = MathUtils.clamp(elapsed / BALL_SAVER_RETRACT_DURATION_MS, 0, 1)
      const startYOffset = retractStartYOffsetRef.current
      yOffset = startYOffset + (dropDistance - startYOffset) * easeOutCubic(progress)

      if (progress >= 1) {
        yOffset = dropDistance
        currentYOffsetRef.current = yOffset
        setPhase("cooldown", now)
      }
    } else if (phaseRef.current === "cooldown") {
      if (elapsed >= BALL_SAVER_COOLDOWN_MS) {
        resetSideTargets()
        setPhase("down", now)
      }
      yOffset = dropDistance
    }

    currentYOffsetRef.current = yOffset
    body.setNextKinematicTranslation({
      x: worldPosition[0],
      y: worldPosition[1] - yOffset,
      z: worldPosition[2],
    })
  })

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders="hull"
      position={worldPosition}
      name={`ball-saver-${side}`}
      onCollisionEnter={handleCollisionEnter}
      onCollisionExit={handleCollisionExit}
      userData={{ side }}
    >
      <primitive object={clone} />
    </RigidBody>
  )
}

export default BallSaver
