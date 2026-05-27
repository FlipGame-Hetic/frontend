import {
  BALL_ANGULAR_DAMPING,
  BALL_FRICTION,
  BALL_LANE_MAX_TANGENT_SPEED,
  BALL_LINEAR_DAMPING,
  BALL_MASS,
  BALL_MAX_NORMAL_SPEED,
  BALL_MAX_TANGENT_SPEED,
  BALL_MIN_NORMAL_SPEED,
  BALL_RESTITUTION,
} from "@/components/balls/ballConfig"
import {
  BUMPER_IMPULSE_STRENGTH,
  BUMPER_RESTITUTION,
  BUMPER_STUCK_FRAMES,
  BUMPER_STUCK_VELOCITY,
  BUMPER_UNSTICK_IMPULSE,
} from "@/components/bumbers/bumperConfig"
import {
  SLIM_BUMPER_IMPULSE_STRENGTH,
  SLIM_BUMPER_RESTITUTION,
  SLIM_BUMPER_STUCK_FRAMES,
  SLIM_BUMPER_STUCK_VELOCITY,
  SLIM_BUMPER_UNSTICK_IMPULSE,
} from "@/components/bumbers/slimBumperConfig"
import {
  FLIPPER_FRICTION,
  FLIPPER_JOINT_MASS,
  FLIPPER_MESH_OFFSET_X,
  FLIPPER_RESTITUTION,
  MAX_ANGLE,
  MOTOR_DAMPING,
  MOTOR_SPEED,
  MOTOR_STIFFNESS,
  REST_ANGLE,
} from "@/components/flipperJoints/jointsConfig"
import { GRAVITY_Y, GRAVITY_Z, SLOW_MOTION_SPEED } from "@/components/physics/physicsConfig"
import {
  SLINGSHOT_IMPULSE_STRENGTH,
  SLINGSHOT_RESTITUTION,
  SLINGSHOT_STUCK_FRAMES,
  SLINGSHOT_STUCK_VELOCITY,
  SLINGSHOT_UNSTICK_IMPULSE,
} from "@/components/slingshots/slingshotConfig"
import {
  BONUS_ZONE_BOUNCE_THRESHOLD,
  BONUS_ZONE_COOLDOWN_MS,
  BONUS_ZONE_RESTITUTION,
  BONUS_ZONE_SPAWN_INTERVAL_MS,
  MULTIBALL_BALL_COUNT,
  MULTIBALL_SPAWN_POSITION1,
  MULTIBALL_SPAWN_POSITION2,
} from "@/components/playfield/bonusZoneConfig"
import {
  PLUNGER_ARROW_PULL_SPEED,
  PLUNGER_BALL_CLEAR_TIMEOUT,
  PLUNGER_CHARGE_FACTOR,
  PLUNGER_IMPULSE_MULTIPLIER,
  PLUNGER_LANE_GATE_HALF_EXTENTS,
  PLUNGER_LANE_GATE_NORMAL,
  PLUNGER_LANE_GATE_POSITION,
  PLUNGER_LANE_GATE_ROTATION,
  PLUNGER_MAX_CHARGE_TIME,
  PLUNGER_MAX_COMPRESSION,
  PLUNGER_MAX_IMPULSE,
  PLUNGER_MIN_CHARGE,
  PLUNGER_MIN_IMPULSE,
  PLUNGER_RELEASE_DELAY,
  PLUNGER_RELEASE_SPEED,
} from "@/components/plunger/plungerConfig"
import { useControls, folder } from "leva"
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react"

export interface MotionDebugControls {
  slowMotionSpeed: number
  slowMotion: boolean
}

export interface GravityDebugControls {
  gravityY: number
  gravityZ: number
}

export interface BallDebugControls {
  mass: number
  restitution: number
  friction: number
  linearDamping: number
  angularDamping: number
  maxTangentSpeed: number
  laneMaxTangentSpeed: number
  minNormalSpeed: number
  maxNormalSpeed: number
}

export interface BumperDebugControls {
  restitution: number
  impulseStrength: number
  stuckFrames: number
  stuckVelocity: number
  unstickImpulse: number
}

export interface SlingshotDebugControls {
  restitution: number
  impulseStrength: number
  stuckFrames: number
  stuckVelocity: number
  unstickImpulse: number
}

export interface PlungerDebugControls {
  minImpulse: number
  maxImpulse: number
  impulseMultiplier: number
  chargeFactor: number
  minCharge: number
  maxChargeTime: number
  arrowPullSpeed: number
  releaseSpeed: number
  releaseDelay: number
  ballClearTimeout: number
  maxCompression: number
}

export interface PlungerGateDebugControls {
  position: [number, number, number]
  halfExtents: [number, number, number]
  rotation: [number, number, number]
  normal: [number, number, number]
}

export interface FlipperDebugControls {
  restAngle: number
  maxAngle: number
  motorSpeed: number
  stiffness: number
  damping: number
  meshOffsetX: number
  mass: number
  friction: number
  restitution: number
}

export interface BonusZoneDebugControls {
  restitution: number
  bounceThreshold: number
  cooldownMs: number
  spawn1X: number
  spawn1Y: number
  spawn1Z: number
  spawn2X: number
  spawn2Y: number
  spawn2Z: number
  spawnIntervalMs: number
  ballCount: number
}

export interface PhysicsDebugControls {
  motion: MotionDebugControls
  gravity: GravityDebugControls
  ball: BallDebugControls
  bumpers: BumperDebugControls
  slimBumpers: BumperDebugControls
  slingshots: SlingshotDebugControls
  plunger: PlungerDebugControls
  flippers: FlipperDebugControls
  bonusZone: BonusZoneDebugControls
  showGate: boolean
  plungerGate: PlungerGateDebugControls
}

const PhysicsDebugContext = createContext<PhysicsDebugControls | null>(null)

// eslint-disable-next-line
export function usePhysicsDebugControls(): PhysicsDebugControls {
  const ctx = useContext(PhysicsDebugContext)
  if (!ctx) {
    throw new Error("usePhysicsDebugControls must be used within PhysicsDebugProvider")
  }
  return ctx
}

export function PhysicsDebugProvider({ children }: { children: ReactNode }) {
  const [motion, setMotion] = useControls(
    "Physics",
    () => ({
      Motion: folder(
        {
          slowMotionSpeed: {
            value: SLOW_MOTION_SPEED,
            min: 0.05,
            max: 1,
            step: 0.05,
            label: "Slow motion speed",
          },
          slowMotion: {
            value: false,
            label: "Slow motion",
          },
        },
        { collapsed: false },
      ),
    }),
    { order: 1 },
  )
  const slowMotionRef = useRef(motion.slowMotion)

  useEffect(() => {
    slowMotionRef.current = motion.slowMotion
  }, [motion.slowMotion])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null

      if (
        e.repeat ||
        e.code !== "ControlLeft" ||
        target?.isContentEditable ||
        target?.closest("input, textarea, select")
      ) {
        return
      }

      setMotion({ slowMotion: !slowMotionRef.current })
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [setMotion])

  const gravity = useControls(
    "Physics",
    {
      Gravity: folder(
        {
          gravityY: { value: GRAVITY_Y, min: -10, max: 10, step: 0.1 },
          gravityZ: { value: GRAVITY_Z, min: 0, max: 100, step: 0.1 },
        },
        { collapsed: true },
      ),
    },
    { order: 2 },
  )

  const ball = useControls("Physics", {
    Ball: folder(
      {
        mass: { value: BALL_MASS, min: 0.5, max: 10, step: 0.1 },
        restitution: { value: BALL_RESTITUTION, min: 0, max: 10, step: 0.05 },
        friction: { value: BALL_FRICTION, min: 0, max: 10, step: 0.01 },
        linearDamping: { value: BALL_LINEAR_DAMPING, min: 0, max: 2, step: 0.01 },
        angularDamping: { value: BALL_ANGULAR_DAMPING, min: 0, max: 2, step: 0.01 },
        maxTangentSpeed: { value: BALL_MAX_TANGENT_SPEED, min: 5, max: 50, step: 1 },
        laneMaxTangentSpeed: {
          value: BALL_LANE_MAX_TANGENT_SPEED,
          min: 10,
          max: 200,
          step: 1,
          label: "Lane max speed",
        },
        minNormalSpeed: { value: BALL_MIN_NORMAL_SPEED, min: -20, max: 0, step: 0.5 },
        maxNormalSpeed: { value: BALL_MAX_NORMAL_SPEED, min: 0, max: 5, step: 0.1 },
      },
      { collapsed: false },
    ),
  })

  const bumpers = useControls("Physics", {
    Bumpers: folder(
      {
        restitution: { value: BUMPER_RESTITUTION, min: 0, max: 1.0, step: 0.05 },
        impulseStrength: { value: BUMPER_IMPULSE_STRENGTH, min: 1, max: 50, step: 1 },
        stuckFrames: { value: BUMPER_STUCK_FRAMES, min: 10, max: 120, step: 5 },
        stuckVelocity: { value: BUMPER_STUCK_VELOCITY, min: 0.1, max: 2.0, step: 0.1 },
        unstickImpulse: { value: BUMPER_UNSTICK_IMPULSE, min: 1, max: 20, step: 1 },
      },
      { collapsed: true },
    ),
  })

  const slimBumpers = useControls("Physics", {
    SlimBumpers: folder(
      {
        restitution: { value: SLIM_BUMPER_RESTITUTION, min: 0, max: 1.0, step: 0.05 },
        impulseStrength: { value: SLIM_BUMPER_IMPULSE_STRENGTH, min: 1, max: 30, step: 1 },
        stuckFrames: { value: SLIM_BUMPER_STUCK_FRAMES, min: 10, max: 120, step: 5 },
        stuckVelocity: { value: SLIM_BUMPER_STUCK_VELOCITY, min: 0.1, max: 2.0, step: 0.1 },
        unstickImpulse: { value: SLIM_BUMPER_UNSTICK_IMPULSE, min: 1, max: 20, step: 1 },
      },
      { collapsed: true },
    ),
  })

  const slingshots = useControls("Physics", {
    Slingshots: folder(
      {
        restitution: { value: SLINGSHOT_RESTITUTION, min: 0, max: 2, step: 0.05 },
        impulseStrength: { value: SLINGSHOT_IMPULSE_STRENGTH, min: 0, max: 40, step: 0.5 },
        stuckFrames: { value: SLINGSHOT_STUCK_FRAMES, min: 5, max: 120, step: 5 },
        stuckVelocity: { value: SLINGSHOT_STUCK_VELOCITY, min: 0.1, max: 5, step: 0.1 },
        unstickImpulse: { value: SLINGSHOT_UNSTICK_IMPULSE, min: 0, max: 40, step: 0.5 },
      },
      { collapsed: true },
    ),
  })

  const plunger = useControls("Physics", {
    Plunger: folder(
      {
        minImpulse: { value: PLUNGER_MIN_IMPULSE, min: 0, max: 50, step: 0.5 },
        maxImpulse: { value: PLUNGER_MAX_IMPULSE, min: 0, max: 250, step: 1 },
        impulseMultiplier: {
          value: PLUNGER_IMPULSE_MULTIPLIER,
          min: 0,
          max: 10,
          step: 0.1,
          label: "Impulse multiplier",
        },
        chargeFactor: {
          value: PLUNGER_CHARGE_FACTOR,
          min: 0.1,
          max: 120,
          step: 0.1,
          label: "Charge curve exponent",
        },
        minCharge: { value: PLUNGER_MIN_CHARGE, min: 0, max: 1, step: 0.01 },
        maxChargeTime: { value: PLUNGER_MAX_CHARGE_TIME, min: 0.1, max: 5, step: 0.05 },
        arrowPullSpeed: { value: PLUNGER_ARROW_PULL_SPEED, min: 0.1, max: 5, step: 0.05 },
        releaseSpeed: { value: PLUNGER_RELEASE_SPEED, min: 1, max: 100, step: 1 },
        releaseDelay: { value: PLUNGER_RELEASE_DELAY, min: 0, max: 0.5, step: 0.01 },
        ballClearTimeout: {
          value: PLUNGER_BALL_CLEAR_TIMEOUT,
          min: 0,
          max: 1,
          step: 0.01,
          label: "Ball clear timeout",
        },
        maxCompression: { value: PLUNGER_MAX_COMPRESSION, min: 0, max: 2, step: 0.01 },
      },
      { collapsed: true },
    ),
  })

  const flippers = useControls("Physics", {
    Flippers: folder(
      {
        restAngle: { value: REST_ANGLE, min: -1.2, max: 0, step: 0.05 },
        maxAngle: { value: MAX_ANGLE, min: 0, max: 4, step: 0.05 },
        motorSpeed: { value: MOTOR_SPEED, min: 1, max: 100, step: 1 },
        stiffness: { value: MOTOR_STIFFNESS, min: 100, max: 5000, step: 50 },
        damping: { value: MOTOR_DAMPING, min: 5, max: 500, step: 5 },
        meshOffsetX: { value: FLIPPER_MESH_OFFSET_X, min: 0, max: 1.5, step: 0.05 },
        mass: { value: FLIPPER_JOINT_MASS, min: 0, max: 10.0, step: 0.5 },
        friction: { value: FLIPPER_FRICTION, min: 0, max: 1.0, step: 0.01 },
        restitution: { value: FLIPPER_RESTITUTION, min: 0, max: 10, step: 0.001 },
      },
      { collapsed: true },
    ),
  })

  const bonusZone = useControls("Physics", {
    BonusZone: folder(
      {
        restitution: { value: BONUS_ZONE_RESTITUTION, min: 0, max: 5, step: 0.05 },
        bounceThreshold: {
          value: BONUS_ZONE_BOUNCE_THRESHOLD,
          min: 1,
          max: 20,
          step: 1,
          label: "Bounce threshold",
        },
        cooldownMs: {
          value: BONUS_ZONE_COOLDOWN_MS,
          min: 1000,
          max: 30000,
          step: 500,
          label: "Cooldown (ms)",
        },
        spawn1X: {
          value: MULTIBALL_SPAWN_POSITION1[0],
          min: -5,
          max: 5,
          step: 0.05,
          label: "Spawn1 X",
        },
        spawn1Y: {
          value: MULTIBALL_SPAWN_POSITION1[1],
          min: -5,
          max: 20,
          step: 0.05,
          label: "Spawn1 Y",
        },
        spawn1Z: {
          value: MULTIBALL_SPAWN_POSITION1[2],
          min: -15,
          max: 5,
          step: 0.05,
          label: "Spawn1 Z",
        },
        spawn2X: {
          value: MULTIBALL_SPAWN_POSITION2[0],
          min: -5,
          max: 5,
          step: 0.05,
          label: "Spawn2 X",
        },
        spawn2Y: {
          value: MULTIBALL_SPAWN_POSITION2[1],
          min: -5,
          max: 20,
          step: 0.05,
          label: "Spawn2 Y",
        },
        spawn2Z: {
          value: MULTIBALL_SPAWN_POSITION2[2],
          min: -15,
          max: 5,
          step: 0.05,
          label: "Spawn2 Z",
        },
        spawnIntervalMs: {
          value: BONUS_ZONE_SPAWN_INTERVAL_MS,
          min: 0,
          max: 1000,
          step: 10,
          label: "Spawn interval (ms)",
        },
        ballCount: { value: MULTIBALL_BALL_COUNT, min: 1, max: 6, step: 1, label: "Ball count" },
      },
      { collapsed: true },
    ),
  })

  const {
    showGate,
    gatePx,
    gatePy,
    gatePz,
    gateHx,
    gateHy,
    gateHz,
    gateRx,
    gateRy,
    gateRz,
    gateNx,
    gateNy,
    gateNz,
  } = useControls("Physics", {
    showGate: { value: false, label: "Show gate debug" },
    PlungerGate: folder(
      {
        gatePx: {
          value: PLUNGER_LANE_GATE_POSITION[0],
          min: -5,
          max: 10,
          step: 0.01,
          label: "Pos X",
        },
        gatePy: {
          value: PLUNGER_LANE_GATE_POSITION[1],
          min: -2,
          max: 5,
          step: 0.01,
          label: "Pos Y",
        },
        gatePz: {
          value: PLUNGER_LANE_GATE_POSITION[2],
          min: -5,
          max: 5,
          step: 0.01,
          label: "Pos Z",
        },
        gateHx: {
          value: PLUNGER_LANE_GATE_HALF_EXTENTS[0],
          min: 0.05,
          max: 3,
          step: 0.01,
          label: "Half X",
        },
        gateHy: {
          value: PLUNGER_LANE_GATE_HALF_EXTENTS[1],
          min: 0.05,
          max: 3,
          step: 0.01,
          label: "Half Y",
        },
        gateHz: {
          value: PLUNGER_LANE_GATE_HALF_EXTENTS[2],
          min: 0.05,
          max: 3,
          step: 0.01,
          label: "Half Z",
        },
        gateRx: {
          value: PLUNGER_LANE_GATE_ROTATION[0],
          min: -Math.PI,
          max: Math.PI,
          step: 0.01,
          label: "Rot X",
        },
        gateRy: {
          value: PLUNGER_LANE_GATE_ROTATION[1],
          min: -Math.PI,
          max: Math.PI,
          step: 0.01,
          label: "Rot Y",
        },
        gateRz: {
          value: PLUNGER_LANE_GATE_ROTATION[2],
          min: -Math.PI,
          max: Math.PI,
          step: 0.01,
          label: "Rot Z",
        },
        gateNx: {
          value: PLUNGER_LANE_GATE_NORMAL[0],
          min: -1,
          max: 1,
          step: 0.01,
          label: "Normal X",
        },
        gateNy: {
          value: PLUNGER_LANE_GATE_NORMAL[1],
          min: -1,
          max: 1,
          step: 0.01,
          label: "Normal Y",
        },
        gateNz: {
          value: PLUNGER_LANE_GATE_NORMAL[2],
          min: -1,
          max: 1,
          step: 0.01,
          label: "Normal Z",
        },
      },
      { collapsed: true },
    ),
  })

  const plungerGate: PlungerGateDebugControls = {
    position: [gatePx, gatePy, gatePz],
    halfExtents: [gateHx, gateHy, gateHz],
    rotation: [gateRx, gateRy, gateRz],
    normal: [gateNx, gateNy, gateNz],
  }

  const value: PhysicsDebugControls = {
    motion,
    gravity,
    ball,
    bumpers,
    slimBumpers,
    slingshots,
    plunger,
    flippers,
    bonusZone,
    showGate,
    plungerGate,
  }

  return <PhysicsDebugContext.Provider value={value}>{children}</PhysicsDebugContext.Provider>
}
