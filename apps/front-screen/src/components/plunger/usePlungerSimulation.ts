import { playSfx } from "@/audio/soundEngine"
import { getPlungerInputSnapshot } from "@/stores/inputStore"
import useScreenShakeStore from "@/stores/useScreenShakeStore"
import type { PositionType } from "@/types/worldTypes"
import { useFrame } from "@react-three/fiber"
import type { CollisionPayload, RapierRigidBody } from "@react-three/rapier"
import { useCallback, useRef } from "react"
import type { Group, Mesh, Vector3 } from "three"
import { normalizedPlayfieldDirection } from "../physics/playfieldPlane"
import { SHAKE_INTENSITY } from "../screenShake/shakeIntensity"
import {
  clampPlungerPosition,
  PLUNGER_KEY,
  PLUNGER_PULL_KEY,
  PLUNGER_RETURN_KEY,
  PLUNGER_MIN_CHARGE,
  PLUNGER_MIN_LAUNCH_CHARGE,
  PLUNGER_BALL_CLEAR_TIMEOUT,
  PLUNGER_CHARGE_FACTOR,
  PLUNGER_IMPULSE_MULTIPLIER,
  PLUNGER_MAX_IMPULSE,
  PLUNGER_MIN_IMPULSE,
  PLUNGER_RELEASE_DELAY,
  PLUNGER_MAX_CHARGE_TIME,
  PLUNGER_ARROW_PULL_SPEED,
  PLUNGER_RELEASE_SPEED,
  PLUNGER_MAX_COMPRESSION,
} from "./plungerConfig"

export interface PlungerMeshPart {
  mesh: Mesh
  position: PositionType
}

export interface PlungerLaunchState {
  token: number
  charge: number
}

interface PlungerSimulationOptions {
  pressedKeys: React.RefObject<Set<string>>
  rootPosition: Vector3
  tipRestPosition: Vector3
  movementAxis: Vector3
}

interface PlungerSimulationResult {
  tipGroupRef: React.RefObject<Group | null>
  rodBodyRef: React.RefObject<RapierRigidBody | null>
  chargeRef: React.RefObject<number>
  launchRef: React.RefObject<PlungerLaunchState>
  handleBallEnter: (payload: CollisionPayload) => void
  handleBallExit: (payload: CollisionPayload) => void
}

export const usePlungerSimulation = ({
  pressedKeys,
  rootPosition,
  tipRestPosition,
  movementAxis,
}: PlungerSimulationOptions): PlungerSimulationResult => {
  const plungerPositionRef = useRef(0)
  const wasSpacePressed = useRef(false)
  const wasArrowPressed = useRef(false)
  const releasingRef = useRef(false)
  const pendingReleaseRef = useRef(false)
  const releaseTimerRef = useRef(0)
  const waitForBallClearRef = useRef(false)
  const ballClearTimerRef = useRef(0)
  const tipGroupRef = useRef<Group | null>(null)
  const rodBodyRef = useRef<RapierRigidBody | null>(null)
  const launchRef = useRef<PlungerLaunchState>({ token: 0, charge: 0 })
  const lastPlungerReleaseToken = useRef(getPlungerInputSnapshot().releaseToken)
  const ballInLaneRef = useRef<RapierRigidBody | null>(null)

  const releaseFromPosition = useCallback((pos: number) => {
    const charge = clampPlungerPosition(pos)

    if (charge >= PLUNGER_MIN_CHARGE) {
      if (ballInLaneRef.current) {
        const isLaunch = charge >= PLUNGER_MIN_LAUNCH_CHARGE
        playSfx(isLaunch ? "plunger_launch" : "flipper_up")
        if (isLaunch) {
          launchRef.current.token += 1
          launchRef.current.charge = charge
          useScreenShakeStore.getState().addTrauma(SHAKE_INTENSITY.plungerLaunch * charge)
        }
        waitForBallClearRef.current = true
        ballClearTimerRef.current = PLUNGER_BALL_CLEAR_TIMEOUT

        const scaledCharge = Math.pow(charge, PLUNGER_CHARGE_FACTOR)
        const impulse =
          (PLUNGER_MIN_IMPULSE + (PLUNGER_MAX_IMPULSE - PLUNGER_MIN_IMPULSE) * scaledCharge) *
          PLUNGER_IMPULSE_MULTIPLIER
        const dir = normalizedPlayfieldDirection({ x: 0, y: 0, z: -1 })

        if (dir) {
          ballInLaneRef.current.applyImpulse(
            {
              x: dir.x * impulse * ballInLaneRef.current.mass(),
              y: dir.y * impulse * ballInLaneRef.current.mass(),
              z: dir.z * impulse * ballInLaneRef.current.mass(),
            },
            true,
          )
        }
      } else {
        waitForBallClearRef.current = false
        ballClearTimerRef.current = 0
      }

      pendingReleaseRef.current = true
      releaseTimerRef.current = PLUNGER_RELEASE_DELAY
    } else {
      plungerPositionRef.current = 0
    }
  }, [])

  const handleBallEnter = useCallback(({ other }: CollisionPayload) => {
    if (other.rigidBodyObject?.name === "ball" && other.rigidBody) {
      ballInLaneRef.current = other.rigidBody
    }
  }, [])

  const handleBallExit = useCallback(({ other }: CollisionPayload) => {
    if (other.rigidBodyObject?.name === "ball") {
      ballInLaneRef.current = null
    }
  }, [])

  useFrame((_, delta) => {
    const plungerInput = getPlungerInputSnapshot()
    const isSpacePressed = pressedKeys.current.has(PLUNGER_KEY)
    const isPullPressed = pressedKeys.current.has(PLUNGER_PULL_KEY)
    const isReturnPressed = pressedKeys.current.has(PLUNGER_RETURN_KEY)
    const isArrowPressed = isPullPressed || isReturnPressed
    const isExternallyHeld = !plungerInput.released

    if (
      plungerInput.releaseToken !== lastPlungerReleaseToken.current &&
      plungerInput.released &&
      !releasingRef.current &&
      !pendingReleaseRef.current
    ) {
      lastPlungerReleaseToken.current = plungerInput.releaseToken
      plungerPositionRef.current = clampPlungerPosition(plungerInput.position)
      ballInLaneRef.current?.wakeUp()
      releaseFromPosition(plungerPositionRef.current)
    } else if (isExternallyHeld && !releasingRef.current && !pendingReleaseRef.current) {
      ballInLaneRef.current?.wakeUp()
      plungerPositionRef.current = clampPlungerPosition(plungerInput.position)
    } else if (!releasingRef.current && !pendingReleaseRef.current) {
      if (isSpacePressed) {
        if (!wasSpacePressed.current) {
          ballInLaneRef.current?.wakeUp()
        }
        plungerPositionRef.current = clampPlungerPosition(
          plungerPositionRef.current + delta / PLUNGER_MAX_CHARGE_TIME,
        )
      }

      if (isPullPressed) {
        if (!wasArrowPressed.current) {
          ballInLaneRef.current?.wakeUp()
        }
        plungerPositionRef.current = clampPlungerPosition(
          plungerPositionRef.current + delta * PLUNGER_ARROW_PULL_SPEED,
        )
      }

      if (isReturnPressed) {
        plungerPositionRef.current = clampPlungerPosition(
          plungerPositionRef.current - delta * PLUNGER_ARROW_PULL_SPEED,
        )
      }

      if (wasSpacePressed.current && !isSpacePressed) {
        releaseFromPosition(plungerPositionRef.current)
      }

      if (wasArrowPressed.current && !isArrowPressed) {
        releaseFromPosition(plungerPositionRef.current)
      }
    }

    if (pendingReleaseRef.current) {
      if (releaseTimerRef.current > 0) {
        releaseTimerRef.current -= delta
      } else if (
        waitForBallClearRef.current &&
        ballInLaneRef.current &&
        ballClearTimerRef.current > 0
      ) {
        ballClearTimerRef.current -= delta
      } else {
        waitForBallClearRef.current = false
        ballClearTimerRef.current = 0
        pendingReleaseRef.current = false
        releasingRef.current = true
      }
    }

    if (releasingRef.current) {
      plungerPositionRef.current = Math.max(
        plungerPositionRef.current - delta * PLUNGER_RELEASE_SPEED,
        0,
      )
      if (plungerPositionRef.current <= 0) {
        releasingRef.current = false
      }
    }

    wasSpacePressed.current = isSpacePressed
    wasArrowPressed.current = isArrowPressed

    const compression = plungerPositionRef.current * PLUNGER_MAX_COMPRESSION
    const offset = movementAxis.clone().multiplyScalar(compression)

    if (tipGroupRef.current) {
      tipGroupRef.current.position.copy(tipRestPosition).add(offset)
    }

    if (rodBodyRef.current) {
      const colliderPosition = rootPosition.clone().add(tipRestPosition).add(offset)
      rodBodyRef.current.setNextKinematicTranslation({
        x: colliderPosition.x,
        y: colliderPosition.y,
        z: colliderPosition.z,
      })
    }
  })

  return {
    tipGroupRef,
    rodBodyRef,
    chargeRef: plungerPositionRef,
    launchRef,
    handleBallEnter,
    handleBallExit,
  }
}
