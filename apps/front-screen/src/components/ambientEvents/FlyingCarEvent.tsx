import { useGLTF } from "@react-three/drei"
import { useMemo, useRef } from "react"
import type { Group } from "three"
import { easeLinear } from "@/utils/easing"
import type { AmbientEventAtomProps } from "./ambientEventsConfig"
import useWaypointPath from "./useWaypointPath"

const FlyingCarEvent = ({ instance, onComplete }: AmbientEventAtomProps) => {
  const outerRef = useRef<Group>(null)
  const { scene } = useGLTF(instance.def.modelUrl)
  const model = useMemo(() => scene.clone(), [scene])

  useWaypointPath(
    outerRef,
    instance.waypoints,
    instance.def.travelDurationMs,
    easeLinear,
    true,
    onComplete,
  )

  return (
    <group ref={outerRef} scale={instance.def.scale}>
      {/* Inner heading offset in case the GLB doesn't face -Z (the lookAt forward axis) */}
      <group rotation-y={instance.def.modelRotationY ?? 0}>
        <primitive object={model} />
      </group>
    </group>
  )
}

export default FlyingCarEvent
