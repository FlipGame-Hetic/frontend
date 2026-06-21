import type { RapierRigidBody } from "@react-three/rapier"
import type { Group } from "three"
import type { PortalId } from "./portalConfig"

export interface ActiveTraversal {
  ballId: string
  fromPortal: PortalId
  masterBody: RapierRigidBody
  enterSign: number
}

const activeTraversals = new Map<string, ActiveTraversal>()
const ghostRefs = new Map<string, Group>()
const cooldowns = new Map<string, number>()
const lockedPortals = new Set<PortalId>()

const pruneExpiredCooldowns = (): void => {
  const now = performance.now()
  for (const [ballId, expiresAt] of cooldowns) {
    if (now > expiresAt) cooldowns.delete(ballId)
  }
}

export const startTraversal = (
  ballId: string,
  fromPortal: PortalId,
  masterBody: RapierRigidBody,
  enterSign: number,
): void => {
  activeTraversals.set(ballId, { ballId, fromPortal, masterBody, enterSign })
  lockedPortals.add(fromPortal)
}

export const endTraversal = (ballId: string): void => {
  const t = activeTraversals.get(ballId)
  if (t) lockedPortals.delete(t.fromPortal)
  activeTraversals.delete(ballId)
}

export const getTraversal = (ballId: string): ActiveTraversal | undefined => {
  return activeTraversals.get(ballId)
}

export const getAllTraversals = (): ActiveTraversal[] => {
  return [...activeTraversals.values()]
}

export const registerGhostRef = (ballId: string, ref: Group): void => {
  ghostRefs.set(ballId, ref)
}

export const unregisterGhostRef = (ballId: string): void => {
  ghostRefs.delete(ballId)
}

export const getGhostRef = (ballId: string): Group | undefined => {
  return ghostRefs.get(ballId)
}

export const setCooldown = (ballId: string, durationMs: number): void => {
  cooldowns.set(ballId, performance.now() + durationMs)
}

export const isCooldown = (ballId: string): boolean => {
  const exp = cooldowns.get(ballId)
  if (exp === undefined) return false
  if (performance.now() > exp) {
    cooldowns.delete(ballId)
    return false
  }
  return true
}

export const isPortalLocked = (portalId: PortalId): boolean => {
  return lockedPortals.has(portalId)
}

export const cleanupPortalBall = (ballId: string): void => {
  endTraversal(ballId)
  ghostRefs.delete(ballId)
  cooldowns.delete(ballId)
}

export const resetPortalTraversalState = (): void => {
  activeTraversals.clear()
  ghostRefs.clear()
  cooldowns.clear()
  lockedPortals.clear()
}

export const getPortalTraversalDebugSnapshot = () => {
  pruneExpiredCooldowns()
  return {
    activeTraversals: activeTraversals.size,
    ghostRefs: ghostRefs.size,
    cooldowns: cooldowns.size,
    lockedPortals: lockedPortals.size,
  }
}
