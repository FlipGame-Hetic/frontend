import type { CollisionPayload } from "@react-three/rapier"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { folder, useControls } from "leva"
import { useCallback, useRef } from "react"
import type { LaneBoosterConfig } from "./laneBoostersConfig"

function hasBallId(value: unknown): value is { ballId: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "ballId" in value &&
    typeof (value as Record<string, unknown>).ballId === "string"
  )
}

const LaneBooster = ({
  id,
  position,
  halfExtents,
  entryAxis,
  entrySign,
  defaultBoostDirX,
  defaultBoostDirZ,
  defaultBoostSpeed,
  defaultMinSpeed,
  defaultCooldownMs,
  lateralCenterX,
}: LaneBoosterConfig) => {
  const { boostDirX, boostDirZ, boostSpeed, minSpeed, cooldownMs } = useControls("Lane Boosters", {
    [id]: folder(
      {
        boostDirX: { value: defaultBoostDirX, min: -2, max: 2, step: 0.1, label: "Dir X" },
        boostDirZ: { value: defaultBoostDirZ, min: -2, max: 2, step: 0.1, label: "Dir Z" },
        boostSpeed: { value: defaultBoostSpeed, min: 0, max: 50, step: 0.5 },
        minSpeed: { value: defaultMinSpeed, min: 0, max: 20, step: 0.5 },
        cooldownMs: { value: defaultCooldownMs, min: 0, max: 2000, step: 50 },
      },
      { collapsed: true },
    ),
  }) as {
    boostDirX: number
    boostDirZ: number
    boostSpeed: number
    minSpeed: number
    cooldownMs: number
  }

  const cooldownRef = useRef(new Map<string, number>())

  const handleEnter = useCallback(
    ({ other }: CollisionPayload) => {
      const obj = other.rigidBodyObject
      if (obj?.name !== "ball") return
      if (!hasBallId(obj.userData)) return

      const ballId = obj.userData.ballId
      const now = performance.now()
      if (now - (cooldownRef.current.get(ballId) ?? 0) < cooldownMs) return

      const body = other.rigidBody
      if (!body) return

      const vel = body.linvel()

      if (Math.hypot(vel.x, vel.z) < minSpeed) return

      const entryVel = entryAxis === "x" ? vel.x : vel.z
      if (Math.sign(entryVel) !== entrySign) return

      let dx = boostDirX
      if (lateralCenterX !== undefined) {
        dx = body.translation().x < lateralCenterX ? Math.abs(boostDirX) : -Math.abs(boostDirX)
      }

      const len = Math.hypot(dx, boostDirZ)
      if (len === 0) return

      body.setLinvel(
        {
          x: (dx / len) * boostSpeed,
          y: vel.y,
          z: (boostDirZ / len) * boostSpeed,
        },
        true,
      )
      cooldownRef.current.set(ballId, now)
    },
    [boostDirX, boostDirZ, boostSpeed, minSpeed, cooldownMs, entryAxis, entrySign, lateralCenterX],
  )

  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider
        sensor
        name={`lane-booster-${id}`}
        args={halfExtents}
        position={position}
        onIntersectionEnter={handleEnter}
      />
    </RigidBody>
  )
}

export default LaneBooster
