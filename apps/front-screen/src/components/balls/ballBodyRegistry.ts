import type { RapierRigidBody } from "@react-three/rapier"

const registry = new Map<string, RapierRigidBody>()

export const registerBallBody = (id: string, body: RapierRigidBody) => {
  registry.set(id, body)
}

export const unregisterBallBody = (id: string) => {
  registry.delete(id)
}

export const getBallBodyEntries = (): [string, RapierRigidBody][] => {
  return [...registry.entries()]
}
