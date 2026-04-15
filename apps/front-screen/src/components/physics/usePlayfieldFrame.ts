import { useCallback, useContext, useRef } from "react"
import * as THREE from "three"
import { PlayfieldContext } from "./PlayfieldContext"

export interface Vector3Like {
  x: number
  y: number
  z: number
}

export function usePlayfieldFrame() {
  const ctx = useContext(PlayfieldContext)
  if (!ctx) {
    throw new Error("usePlayfieldFrame must be used inside <PlayfieldProvider>")
  }

  const q = useRef(new THREE.Quaternion())
  const qInv = useRef(new THREE.Quaternion())
  const v = useRef(new THREE.Vector3())

  const localToWorldVector = useCallback(
    (local: Vector3Like, out?: THREE.Vector3) => {
      const target = out ?? v.current.clone()
      target.set(local.x, local.y, local.z)
      if (ctx.ref.current) {
        ctx.ref.current.getWorldQuaternion(q.current)
        target.applyQuaternion(q.current)
      }
      return target
    },
    [ctx],
  )

  const worldToLocalVector = useCallback(
    (world: Vector3Like, out?: THREE.Vector3) => {
      const target = out ?? v.current.clone()
      target.set(world.x, world.y, world.z)
      if (ctx.ref.current) {
        ctx.ref.current.getWorldQuaternion(q.current)
        qInv.current.copy(q.current).invert()
        target.applyQuaternion(qInv.current)
      }
      return target
    },
    [ctx],
  )

  return { localToWorldVector, worldToLocalVector }
}
