import { playSfx } from "@/audio/soundEngine"
import { getPlungerInputSnapshot } from "@/input/inputState"
import useScreenShakeStore from "@/stores/useScreenShakeStore"
import type { PositionType } from "@/types/worldTypes"
import { useFrame } from "@react-three/fiber"
import type { CollisionPayload, RapierRigidBody } from "@react-three/rapier"
import { useCallback, useRef, type RefObject } from "react"
import type { Group, Mesh, Vector3 } from "three"
import { normalizedPlayfieldDirection } from "../../playfield/playfieldConfig"
import { SHAKE_INTENSITY } from "../../screenShake/screenShakeConfig"
import { getPlungerImpulse, PLUNGER_KEYBOARD_KEY, PLUNGER_MAX_COMPRESSION } from "../plungerConfig"
import {
  advancePlungerState,
  createPlungerSimState,
  type PlungerSimCommands,
} from "./plungerSimulationRuntime"

export interface PlungerMeshPart {
  mesh: Mesh
  position: PositionType
}

// Launch event watched by the VFX, with a token incrementing per launch so effects can trigger even if the same charge is sent multiple times
export interface PlungerLaunchState {
  token: number
  charge: number
}

interface PlungerSimulationOptions {
  pressedKeys: RefObject<Set<string>>
  rootPosition: Vector3
  tipRestPosition: Vector3
  movementAxis: Vector3
}

interface PlungerSimulationResult {
  tipGroupRef: RefObject<Group | null>
  rodBodyRef: RefObject<RapierRigidBody | null>
  chargeRef: RefObject<number>
  launchRef: RefObject<PlungerLaunchState>
  handleBallEnter: (payload: CollisionPayload) => void
  handleBallExit: (payload: CollisionPayload) => void
}

// Pushes the ball out of the lane when the plunger fires
const applyPlungerImpulse = (body: RapierRigidBody, charge: number): void => {
  // The lane points up the table at -Z, but the table is tilted, so we project that direction onto the tilt to get the real launch direction
  const dir = normalizedPlayfieldDirection({ x: 0, y: 0, z: -1 })
  if (!dir) return

  const impulse = getPlungerImpulse(charge)

  const mass = body.mass()
  // Multiplying by the ball mass keeps the launch speed the same whatever the ball weighs
  body.applyImpulse(
    {
      x: dir.x * impulse * mass,
      y: dir.y * impulse * mass,
      z: dir.z * impulse * mass,
    },
    true,
  )
}

// Feeds input to the state machine then turns its commands into visual effects, and moves the rod
export const usePlungerSimulation = ({
  pressedKeys,
  rootPosition,
  tipRestPosition,
  movementAxis,
}: PlungerSimulationOptions): PlungerSimulationResult => {
  // The whole state lives in a ref so updating it never re-renders the component
  const plungerStateRef = useRef(createPlungerSimState(getPlungerInputSnapshot().releaseToken))
  // Current charge from 0 to 1, the VFX read it every frame
  const chargeRef = useRef(0)
  // The visual tip group we slide back and forth
  const tipGroupRef = useRef<Group | null>(null)
  // The kinematic rod body we move by hand to actually hit the ball
  const rodBodyRef = useRef<RapierRigidBody | null>(null)
  const launchRef = useRef<PlungerLaunchState>({ token: 0, charge: 0 })
  // The ball currently sitting in the lane, or null, set by the sensor callbacks
  const ballInLaneRef = useRef<RapierRigidBody | null>(null)

  // Turns the state machine's plain command object into real effects
  const applyCommands = useCallback((commands: PlungerSimCommands) => {
    const ballInLane = ballInLaneRef.current

    // A sleeping Rapier body ignores impulses, so it has to be woken up before being moved
    if (commands.wakeBall) {
      ballInLane?.wakeUp()
    }

    if (commands.playSfx) {
      playSfx(commands.playSfx)
    }

    if (commands.launch && ballInLane) {
      const { charge } = commands.launch
      // Bump the token to differenciate two launches
      launchRef.current.token += 1
      launchRef.current.charge = charge
      // Stronger charge shakes the screen harder
      useScreenShakeStore.getState().addTrauma(SHAKE_INTENSITY.plungerLaunch * charge)
      applyPlungerImpulse(ballInLane, charge)
    }
  }, [])

  // Keep a ball sitting in the lane in ref so the launch can target it
  const handleBallEnter = useCallback(({ other }: CollisionPayload) => {
    if (other.rigidBodyObject?.name === "ball" && other.rigidBody) {
      ballInLaneRef.current = other.rigidBody
    }
  }, [])

  // Forget the ball once it leaves the lane so a later launch does not push a ball that is no longer there
  const handleBallExit = useCallback(({ other }: CollisionPayload) => {
    if (other.rigidBodyObject?.name === "ball") {
      ballInLaneRef.current = null
    }
  }, [])

  // Every frame we feed input into the pure reducer, apply its commands, then move the visual tip and the kinematic rod collider
  useFrame((_, delta) => {
    const plungerInput = getPlungerInputSnapshot()
    const isHeld = pressedKeys.current.has(PLUNGER_KEYBOARD_KEY)

    // Feed the input and current state to the runtime function to get new state and commands to trigger
    const { state, commands } = advancePlungerState(plungerStateRef.current, {
      dt: delta,
      isHeld,
      isExternallyHeld: !plungerInput.released,
      releaseToken: plungerInput.releaseToken,
      released: plungerInput.released,
      externalPosition: plungerInput.position,
      hasBallInLane: ballInLaneRef.current !== null,
    })

    plungerStateRef.current = state
    chargeRef.current = state.position
    applyCommands(commands)

    // Convert the normalized plunger position into a position offset along the movementAxis
    const compression = state.position * PLUNGER_MAX_COMPRESSION
    const offset = movementAxis.clone().multiplyScalar(compression)

    if (tipGroupRef.current) {
      tipGroupRef.current.position.copy(tipRestPosition).add(offset)
    }

    // Move the rod collider, it is a child of the group so it needs the full world position, (rootPosition) plus tip plus offset
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
