/**
 * Global Registry of live ball physics bodies, keyed by ball id (see
 * apps/front-screen/README.md -> State management). Non-reactive on purpose:
 * the physics loop registers/looks up bodies here every frame without going
 * through React, so updates never trigger a re-render.
 */
import type { RapierRigidBody } from "@react-three/rapier"

const registry = new Map<string, RapierRigidBody>()

export const registerBallBody = (id: string, body: RapierRigidBody) => {
  registry.set(id, body)
}

export const unregisterBallBody = (id: string) => {
  registry.delete(id)
}
