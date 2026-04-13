import useBallStore from "@/stores/useBallStore"
import type { PositionType } from "@/types/worldTypes"
import { useControls, button } from "leva"
import Ball from "./Ball"

const spawnConfig = { x: 0 }
const rampShotConfig = {
  speed: Math.hypot(7, 3, 12),
  burstCount: 2,
  burstSpacingMs: 140,
}

const LEFT_RAMP_TEST_VELOCITY: PositionType = [-4, 3, -12]
const RIGHT_RAMP_TEST_VELOCITY: PositionType = [4, 3, -12]
const LEFT_RAMP_TEST_SPAWN: PositionType = [-2.4, 0.5, 7.0]
const RIGHT_RAMP_TEST_SPAWN: PositionType = [2.4, 0.5, 7.0]

function scaleVelocity(velocity: PositionType, targetSpeed: number): PositionType {
  const magnitude = Math.hypot(velocity[0], velocity[1], velocity[2])
  const ratio = magnitude === 0 ? 0 : targetSpeed / magnitude
  return [velocity[0] * ratio, velocity[1] * ratio, velocity[2] * ratio]
}

function scheduleRampBurst(
  spawnBallWithVelocity: (position: PositionType, velocity: PositionType) => void,
  spawnPosition: PositionType,
  baseVelocity: PositionType,
  targetSpeed: number,
  count: number,
  spacingMs: number,
) {
  const velocity = scaleVelocity(baseVelocity, targetSpeed)
  for (let index = 0; index < count; index++) {
    window.setTimeout(() => {
      spawnBallWithVelocity(spawnPosition, velocity)
    }, index * spacingMs)
  }
}

const BallsManager = () => {
  const { balls, spawnBall, spawnBallWithVelocity } = useBallStore()

  useControls("Ball Spawner", {
    spawnX: {
      value: 0,
      min: -4,
      max: 4,
      step: 0.1,
      label: "Spawn X",
      onChange: (v: number) => {
        spawnConfig.x = v
      },
    },
    rampShotSpeed: {
      value: rampShotConfig.speed,
      min: 8,
      max: 30,
      step: 0.25,
      label: "Ramp shot speed",
      onChange: (v: number) => {
        rampShotConfig.speed = v
      },
    },
    rampBurstCount: {
      value: rampShotConfig.burstCount,
      min: 1,
      max: 3,
      step: 1,
      label: "Ramp burst count",
      onChange: (v: number) => {
        rampShotConfig.burstCount = v
      },
    },
    rampBurstSpacingMs: {
      value: rampShotConfig.burstSpacingMs,
      min: 50,
      max: 600,
      step: 10,
      label: "Burst spacing ms",
      onChange: (v: number) => {
        rampShotConfig.burstSpacingMs = v
      },
    },
    "Spawn Ball": button(() => {
      spawnBall([spawnConfig.x, 5, -8])
    }),
    "→ Left Ramp": button(() => {
      spawnBallWithVelocity(
        LEFT_RAMP_TEST_SPAWN,
        scaleVelocity(LEFT_RAMP_TEST_VELOCITY, rampShotConfig.speed),
      )
    }),
    "→ Right Ramp": button(() => {
      spawnBallWithVelocity(
        RIGHT_RAMP_TEST_SPAWN,
        scaleVelocity(RIGHT_RAMP_TEST_VELOCITY, rampShotConfig.speed),
      )
    }),
    "Burst Left Ramp": button(() => {
      scheduleRampBurst(
        spawnBallWithVelocity,
        LEFT_RAMP_TEST_SPAWN,
        LEFT_RAMP_TEST_VELOCITY,
        rampShotConfig.speed,
        rampShotConfig.burstCount,
        rampShotConfig.burstSpacingMs,
      )
    }),
    "Burst Right Ramp": button(() => {
      scheduleRampBurst(
        spawnBallWithVelocity,
        RIGHT_RAMP_TEST_SPAWN,
        RIGHT_RAMP_TEST_VELOCITY,
        rampShotConfig.speed,
        rampShotConfig.burstCount,
        rampShotConfig.burstSpacingMs,
      )
    }),
  })

  return (
    <>
      {balls.map((ball) => (
        <Ball key={ball.id} id={ball.id} position={ball.position} />
      ))}
    </>
  )
}

export default BallsManager
