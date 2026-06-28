import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import type { Group } from "three"
import { easeInOutCubic } from "@/utils/easing"
import type { AmbientEventAtomProps } from "./ambientEventsConfig"
import useWaypointPath from "./useWaypointPath"

const HolocronEvent = ({ instance, onComplete }: AmbientEventAtomProps) => {
  const groupRef = useRef<Group>(null)
  const { scene } = useGLTF(instance.def.modelUrl)
  const model = useMemo(() => scene.clone(), [scene])
  const spinSpeed = instance.def.spinSpeed ?? 0

  useWaypointPath(
    groupRef,
    instance.waypoints,
    instance.def.travelDurationMs,
    easeInOutCubic,
    false,
    onComplete,
  )

  // Free self-rotation on top of the drift ; orientToPath stays off so this isn't overwritten
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += spinSpeed * delta
  })

  return (
    <group ref={groupRef} scale={instance.def.scale}>
      <primitive object={model} />
    </group>
  )
}

export default HolocronEvent
