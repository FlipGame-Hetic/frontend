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
  defaultBoostX,
  defaultBoostZ,
  defaultMinSpeed,
  defaultCooldownMs,
  lateralCenterX,
}: LaneBoosterConfig) => {
  const { boostX, boostZ, minSpeed, cooldownMs } = useControls("Lane Boosters", {
    [id]: folder(
      {
        boostX: { value: defaultBoostX, min: -50, max: 50, step: 0.5 },
        boostZ: { value: defaultBoostZ, min: -50, max: 50, step: 0.5 },
        minSpeed: { value: defaultMinSpeed, min: 0, max: 20, step: 0.5 },
        cooldownMs: { value: defaultCooldownMs, min: 0, max: 2000, step: 50 },
      },
      { collapsed: true },
    ),
  }) as { boostX: number; boostZ: number; minSpeed: number; cooldownMs: number }

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

      let finalX = boostX
      if (lateralCenterX !== undefined) {
        const magnitude = Math.abs(boostX)
        finalX = body.translation().x < lateralCenterX ? magnitude : -magnitude
      }

      body.setLinvel({ x: finalX, y: vel.y, z: boostZ }, true)
      cooldownRef.current.set(ballId, now)
    },
    [boostX, boostZ, minSpeed, cooldownMs, entryAxis, entrySign, lateralCenterX],
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
