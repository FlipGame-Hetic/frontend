import { broadcastEvent } from "@frontend/ws"
import { useFrame } from "@react-three/fiber"
import { RigidBody, type CollisionEnterPayload, type RapierRigidBody } from "@react-three/rapier"
import { useCallback, useMemo, useRef } from "react"
import { Quaternion, Vector3, type Mesh } from "three"
import { cloneWithWorldOrientation } from "../playfield/usePlayfieldModel"

interface TargetProps {
  mesh: Mesh
  worldPosition: [number, number, number]
}

const STANDUP_ANGLE = Math.PI / 4
const STANDUP_DURATION = 500
const DROP_OFFSET = 0.8

const Target = ({ mesh, worldPosition }: TargetProps) => {
  const bodyRef = useRef<RapierRigidBody>(null)
  const isStandup = mesh.name.includes("_standup")
  const hitTime = useRef<number | null>(null)
  const isDropped = useRef(false)

  const clone = useMemo(() => cloneWithWorldOrientation(mesh), [mesh])

  const handleCollision = useCallback(
    ({ other }: CollisionEnterPayload) => {
      if (other.rigidBodyObject?.name !== "ball") return
      broadcastEvent({ event_type: "target_hit", payload: { target_id: mesh.name } })

      if (isStandup) {
        hitTime.current = performance.now()
      } else if (!isDropped.current) {
        isDropped.current = true
      }
    },
    [mesh.name, isStandup],
  )

  useFrame(() => {
    if (!bodyRef.current) return
    const [x, y, z] = worldPosition

    if (isStandup) {
      let angle = 0
      if (hitTime.current !== null) {
        const elapsed = performance.now() - hitTime.current
        if (elapsed < STANDUP_DURATION) {
          angle = STANDUP_ANGLE * (1 - elapsed / STANDUP_DURATION)
        } else {
          hitTime.current = null
        }
      }
      const q = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), angle)
      bodyRef.current.setNextKinematicTranslation({ x, y, z })
      bodyRef.current.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
    } else if (isDropped.current) {
      bodyRef.current.setNextKinematicTranslation({ x, y, z: z + DROP_OFFSET })
    }
  })

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders="trimesh"
      position={worldPosition}
      onCollisionEnter={handleCollision}
    >
      <primitive object={clone} />
    </RigidBody>
  )
}

export default Target
