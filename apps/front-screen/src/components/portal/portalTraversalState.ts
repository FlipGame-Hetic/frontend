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

export function startTraversal(
  ballId: string,
  fromPortal: PortalId,
  masterBody: RapierRigidBody,
  enterSign: number,
): void {
  activeTraversals.set(ballId, { ballId, fromPortal, masterBody, enterSign })
  lockedPortals.add(fromPortal)
}

export function endTraversal(ballId: string): void {
  const t = activeTraversals.get(ballId)
  if (t) lockedPortals.delete(t.fromPortal)
  activeTraversals.delete(ballId)
}

export function getTraversal(ballId: string): ActiveTraversal | undefined {
  return activeTraversals.get(ballId)
}

export function getAllTraversals(): ActiveTraversal[] {
  return [...activeTraversals.values()]
}

export function registerGhostRef(ballId: string, ref: Group): void {
  ghostRefs.set(ballId, ref)
}

export function unregisterGhostRef(ballId: string): void {
  ghostRefs.delete(ballId)
}

export function getGhostRef(ballId: string): Group | undefined {
  return ghostRefs.get(ballId)
}

export function setCooldown(ballId: string, durationMs: number): void {
  cooldowns.set(ballId, performance.now() + durationMs)
}

export function isCooldown(ballId: string): boolean {
  const exp = cooldowns.get(ballId)
  if (exp === undefined) return false
  if (performance.now() > exp) {
    cooldowns.delete(ballId)
    return false
  }
  return true
}

export function isPortalLocked(portalId: PortalId): boolean {
  return lockedPortals.has(portalId)
}

export function cleanupAll(): void {
  activeTraversals.clear()
  ghostRefs.clear()
  cooldowns.clear()
  lockedPortals.clear()
}
