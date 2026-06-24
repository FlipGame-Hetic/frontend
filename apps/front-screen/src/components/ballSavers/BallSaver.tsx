import useTargetStore from "@/stores/useTargetStore"
import { playSfx } from "@/audio/soundEngine"
import { broadcastEvent } from "@frontend/ws"
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
import { hasBallId } from "@/components/balls/runtime/ballUserData"
import useBallStore from "@/stores/useBallStore"
import useBallSaverPhaseStore from "@/stores/useBallSaverPhaseStore"
import { cloneWithWorldOrientation } from "../playfield/usePlayfieldModel"
import { setBodyCollidersEnabled } from "../physics/collision/rigidBodyColliders"
import { easeOutCubic } from "@/utils/easing"
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
  type BallSaverPhase,
  type BallSaverSide,
} from "./ballSaverConfig"

interface BallSaverProps {
  mesh: Mesh
  side: BallSaverSide
  worldPosition: PositionType
}

type BallCollisionTarget = CollisionEnterPayload["other"]

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
  // Tracks the current collider on/off state to avoid triggering redundant Rapier toggles every frame
  const collidersEnabledRef = useRef<boolean | null>(null)
  // Collision keys of the balls currently touching the saver
  const activeContactsRef = useRef(new Set<string>())
  // Timestamp at which the consume fires once the last ball leaves, null when disarmed
  const pendingConsumeAtRef = useRef<number | null>(null)
  // When the first ball touched, paired with lastExit to measure how long balls rested on the saver
  const firstContactAtRef = useRef<number | null>(null)
  const lastExitAtRef = useRef<number | null>(null)
  // Current vertical sink below the table, 0 when fully raised
  const currentYOffsetRef = useRef(0)
  // Offset captured when retraction begins so the retract animation eases from wherever the saver was
  const retractStartYOffsetRef = useRef(0)
  const phaseStartedAtRef = useRef(0)
  const phaseRef = useRef<BallSaverPhase>("down")
  // Store setters to publish this side's phase and cooldown end to the rest of the UI
  const publishPhase = useBallSaverPhaseStore((state) => state.setPhase)
  const publishCooldownEndsAt = useBallSaverPhaseStore((state) => state.setCooldownEndsAt)

  const targetsDown = useTargetStore((state) =>
    areBallSaverTargetsDown(side, state.activatedTargetIds),
  )

  const clone = useMemo(() => cloneWithWorldOrientation(mesh), [mesh])
  // How far the saver sinks below the table when down, derived from the mesh height so it fully hides
  const dropDistance = useMemo(() => {
    const size = new Vector3()
    new Box3().setFromObject(clone).getSize(size)
    return Math.max(size.y - BALL_SAVER_VISIBLE_HEIGHT, size.y * BALL_SAVER_MIN_DROP_RATIO)
  }, [clone])

  const setPhase = useCallback(
    (nextPhase: BallSaverPhase, now = performance.now()) => {
      const previousPhase = phaseRef.current
      phaseRef.current = nextPhase
      phaseStartedAtRef.current = now
      if (previousPhase !== nextPhase) publishPhase(side, nextPhase)
    },
    [publishPhase, side],
  )

  const setCollidersEnabled = useCallback((enabled: boolean) => {
    if (!bodyRef.current || collidersEnabledRef.current === enabled) return
    setBodyCollidersEnabled(bodyRef.current, enabled)
    collidersEnabledRef.current = enabled
  }, [])

  useEffect(() => {
    publishPhase(side, "down")

    return () => {
      publishPhase(side, "down")
    }
  }, [publishPhase, side])

  const resetSideTargets = useCallback(() => {
    const targetStore = useTargetStore.getState()
    BALL_SAVER_TARGET_IDS[side].forEach((targetId) => {
      targetStore.resetTarget(targetId)
    })
  }, [side])

  // A ball rested on the raised saver long enough : retract it and burn the protection for this side
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

  // Raise the saver when this side's targets are all down, drop it back instantly if they get re-enabled mid-cycle
  useEffect(() => {
    if (targetsDown) {
      if (phaseRef.current === "down") {
        setCollidersEnabled(false)
        setPhase("rising")
        playSfx("ballsaver_up")
        const playingBallId = useBallStore.getState().playingBallIds[0]
        broadcastEvent({
          event_type: "BallSaverReady",
          payload: playingBallId ? { ball_id: playingBallId } : {},
        })
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

    // Stamp when the first ball touches, used later to measure how long it actually rested on the saver
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

    // Last ball left : arm a delayed consume so a ball that only grazes and bounces straight off doesn't burn protection
    if (activeContactsRef.current.size === 0) {
      lastExitAtRef.current = performance.now()
      pendingConsumeAtRef.current = performance.now() + BALL_SAVER_POST_EXIT_DELAY_MS
    }
  }, [])

  // Drives the kinematic saver each frame through its rise -> active -> retract -> cooldown phases
  useFrame(() => {
    const body = bodyRef.current
    if (!body) return

    const now = performance.now()

    if (
      phaseRef.current === "active" &&
      pendingConsumeAtRef.current !== null &&
      now >= pendingConsumeAtRef.current
    ) {
      // Only burn protection if the ball rested long enough, a brief graze is ignored and the saver stays active
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
        publishCooldownEndsAt(side, now + BALL_SAVER_COOLDOWN_MS)
      }
    } else if (phaseRef.current === "cooldown") {
      if (elapsed >= BALL_SAVER_COOLDOWN_MS) {
        resetSideTargets()
        setPhase("down", now)
        publishCooldownEndsAt(side, null)
      }
      yOffset = dropDistance
    }

    currentYOffsetRef.current = yOffset
    // Kinematic body : drive its Y by hand each frame instead of letting physics move it
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
