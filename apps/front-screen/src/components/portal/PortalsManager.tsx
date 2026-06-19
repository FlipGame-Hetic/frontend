import useBallStore from "@/stores/useBallStore"
import usePortalTraversalStore from "@/stores/usePortalTraversalStore"
import useScorePopupsStore from "@/stores/useScorePopupsStore"
import { getBallColorForCharacter } from "@/config/characterColors"
import { playRandomSfx } from "@/audio/soundEngine"
import { broadcastEvent } from "@frontend/ws"
import { useFrame } from "@react-three/fiber"
import type { CollisionPayload } from "@react-three/rapier"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { useCallback } from "react"
import { Vector3 } from "three"
import { getBallId } from "@/components/balls/ballUserData"
import {
  PORTAL_A_POSITION,
  PORTAL_A_ROTATION,
  PORTAL_B_POSITION,
  PORTAL_B_ROTATION,
  PORTAL_REENTRY_COOLDOWN_MS,
  PORTAL_SENSOR_HALF_EXTENTS,
  PORTAL_SWAP_THRESHOLD_Z,
  ghostPositionThroughPortal,
  getPortalNormal,
  getPortalPosition,
  transformThroughPortal,
  type PortalId,
} from "./portalConfig"
import {
  endTraversal,
  getAllTraversals,
  getGhostRef,
  getTraversal,
  isCooldown,
  isPortalLocked,
  setCooldown,
  startTraversal,
} from "./portalTraversalState"
import PortalGhost from "./PortalGhost"
import PortalSurface from "./PortalSurface"
import useScreenShakeStore from "@/stores/useScreenShakeStore"
import { SHAKE_INTENSITY } from "@/components/screenShake/screenShakeConfig"

const extractBallId = (payload: CollisionPayload): string | null => {
  const obj = payload.other.rigidBodyObject
  if (obj?.name !== "ball") return null
  return getBallId(obj.userData) ?? null
}

const handlePortalEnter = (portalId: PortalId, payload: CollisionPayload): void => {
  const ballId = extractBallId(payload)
  if (!ballId) return
  if (isCooldown(ballId)) return
  if (isPortalLocked(portalId)) return
  if (getTraversal(ballId)) return

  const masterBody = payload.other.rigidBody
  if (!masterBody) return

  const vel = masterBody.linvel()
  const normal = getPortalNormal(portalId)
  const velAlongNormal = new Vector3(vel.x, vel.y, vel.z).dot(normal)
  if (velAlongNormal >= 0) return

  startTraversal(ballId, portalId, masterBody, 1)
  usePortalTraversalStore.getState().addGhost(ballId)
  playRandomSfx("portal_enter")
  useScreenShakeStore.getState().addTrauma(SHAKE_INTENSITY.portalEnter)
}

const handlePortalExit = (portalId: PortalId, payload: CollisionPayload): void => {
  const ballId = extractBallId(payload)
  if (!ballId) return

  const traversal = getTraversal(ballId)
  if (traversal?.fromPortal !== portalId) return

  endTraversal(ballId)
  usePortalTraversalStore.getState().removeGhost(ballId)
}

const PortalsManager = () => {
  const ghostBallIds = usePortalTraversalStore((s) => s.ghostBallIds)
  const ballColor = getBallColorForCharacter()

  useFrame(() => {
    const traversals = getAllTraversals()
    if (traversals.length === 0) return

    const ballIdSet = new Set(useBallStore.getState().balls.map((b) => b.id))

    for (const traversal of traversals) {
      const { ballId, fromPortal, masterBody, enterSign } = traversal

      if (!ballIdSet.has(ballId)) {
        endTraversal(ballId)
        usePortalTraversalStore.getState().removeGhost(ballId)
        continue
      }

      const pos = masterBody.translation()
      const vel = masterBody.linvel()
      const ballPos = new Vector3(pos.x, pos.y, pos.z)
      const ballVel = new Vector3(vel.x, vel.y, vel.z)

      const portalPos = getPortalPosition(fromPortal)
      const normal = getPortalNormal(fromPortal)
      const relPos = ballPos.clone().sub(new Vector3(...portalPos))
      const depth = relPos.dot(normal)

      const ghostPos = ghostPositionThroughPortal(fromPortal, ballPos)
      const ghostGroup = getGhostRef(ballId)
      if (ghostGroup) {
        ghostGroup.position.set(ghostPos.x, ghostPos.y, ghostPos.z)
      }

      if (depth * enterSign <= PORTAL_SWAP_THRESHOLD_Z) {
        const { vel: newVel } = transformThroughPortal(fromPortal, ballPos, ballVel)
        masterBody.setTranslation({ x: ghostPos.x, y: ghostPos.y, z: ghostPos.z }, true)
        masterBody.setLinvel({ x: newVel.x, y: newVel.y, z: newVel.z }, true)

        playRandomSfx("portal_exit")
        useScreenShakeStore.getState().addTrauma(SHAKE_INTENSITY.portalExit)
        useScorePopupsStore
          .getState()
          .recordHit({ x: ghostPos.x, y: ghostPos.y, z: ghostPos.z }, ballId, "portal")
        broadcastEvent({ event_type: "PortalUsed", payload: { ball_id: ballId } })
        setCooldown(ballId, PORTAL_REENTRY_COOLDOWN_MS)
        endTraversal(ballId)
        usePortalTraversalStore.getState().removeGhost(ballId)
      }
    }
  })

  const handleEnterA = useCallback((payload: CollisionPayload) => {
    handlePortalEnter("A", payload)
  }, [])
  const handleEnterB = useCallback((payload: CollisionPayload) => {
    handlePortalEnter("B", payload)
  }, [])
  const handleExitA = useCallback((payload: CollisionPayload) => {
    handlePortalExit("A", payload)
  }, [])
  const handleExitB = useCallback((payload: CollisionPayload) => {
    handlePortalExit("B", payload)
  }, [])

  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          sensor
          args={PORTAL_SENSOR_HALF_EXTENTS}
          position={PORTAL_A_POSITION}
          rotation={PORTAL_A_ROTATION}
          onIntersectionEnter={handleEnterA}
          onIntersectionExit={handleExitA}
        />
      </RigidBody>

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          sensor
          args={PORTAL_SENSOR_HALF_EXTENTS}
          position={PORTAL_B_POSITION}
          rotation={PORTAL_B_ROTATION}
          onIntersectionEnter={handleEnterB}
          onIntersectionExit={handleExitB}
        />
      </RigidBody>

      <PortalSurface portalId="A" />
      <PortalSurface portalId="B" />

      {ghostBallIds.map((ballId) => (
        <PortalGhost key={ballId} ballId={ballId} color={ballColor} />
      ))}
    </>
  )
}

export default PortalsManager
