import { playSfx } from "@/audio/soundEngine"
import { getPlungerInputSnapshot } from "@/input/inputState"
import useScreenShakeStore from "@/stores/useScreenShakeStore"
import type { PositionType } from "@/types/worldTypes"
import { useFrame } from "@react-three/fiber"
import type { CollisionPayload, RapierRigidBody } from "@react-three/rapier"
import { useCallback, useRef } from "react"
import type { Group, Mesh, Vector3 } from "three"
import { normalizedPlayfieldDirection } from "../../physics/playfieldPlane"
import { SHAKE_INTENSITY } from "../../screenShake/screenShakeConfig"
import { getPlungerImpulse, PLUNGER_KEY, PLUNGER_MAX_COMPRESSION } from "../plungerConfig"
import {
  advancePlungerState,
  createPlungerSimState,
  type PlungerSimCommands,
} from "./plungerSimulationRuntime"

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

const applyPlungerImpulse = (body: RapierRigidBody, charge: number): void => {
  const dir = normalizedPlayfieldDirection({ x: 0, y: 0, z: -1 })
  if (!dir) return

  const impulse = getPlungerImpulse(charge)
  const mass = body.mass()

  body.applyImpulse(
    {
      x: dir.x * impulse * mass,
      y: dir.y * impulse * mass,
      z: dir.z * impulse * mass,
    },
    true,
  )
}

export const usePlungerSimulation = ({
  pressedKeys,
  rootPosition,
  tipRestPosition,
  movementAxis,
}: PlungerSimulationOptions): PlungerSimulationResult => {
  const plungerStateRef = useRef(createPlungerSimState(getPlungerInputSnapshot().releaseToken))
  const chargeRef = useRef(0)
  const tipGroupRef = useRef<Group | null>(null)
  const rodBodyRef = useRef<RapierRigidBody | null>(null)
  const launchRef = useRef<PlungerLaunchState>({ token: 0, charge: 0 })
  const ballInLaneRef = useRef<RapierRigidBody | null>(null)

  const applyCommands = useCallback((commands: PlungerSimCommands) => {
    const ballInLane = ballInLaneRef.current

    if (commands.wakeBall) {
      ballInLane?.wakeUp()
    }

    if (commands.playSfx) {
      playSfx(commands.playSfx)
    }

    if (commands.launch && ballInLane) {
      const { charge } = commands.launch
      launchRef.current.token += 1
      launchRef.current.charge = charge
      useScreenShakeStore.getState().addTrauma(SHAKE_INTENSITY.plungerLaunch * charge)
      applyPlungerImpulse(ballInLane, charge)
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

    const { state, commands } = advancePlungerState(plungerStateRef.current, {
      dt: delta,
      isSpacePressed,
      isExternallyHeld: !plungerInput.released,
      releaseToken: plungerInput.releaseToken,
      released: plungerInput.released,
      externalPosition: plungerInput.position,
      hasBallInLane: ballInLaneRef.current !== null,
    })

    plungerStateRef.current = state
    chargeRef.current = state.position
    applyCommands(commands)

    const compression = state.position * PLUNGER_MAX_COMPRESSION
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
    chargeRef,
    launchRef,
    handleBallEnter,
    handleBallExit,
  }
}
