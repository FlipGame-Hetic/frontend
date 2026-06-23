import type { RapierRigidBody } from "@react-three/rapier"

export const setBodyCollidersEnabled = (
  body: RapierRigidBody | null | undefined,
  enabled: boolean,
): void => {
  if (!body) return

  for (let i = 0; i < body.numColliders(); i += 1) {
    body.collider(i).setEnabled(enabled)
  }
}
