import { useFrame } from "@react-three/fiber"
import { useControls } from "leva"
import { useMemo, useRef } from "react"
import type * as THREE from "three"
import { SPOTS_OPACITY } from "@/audio/audioReactiveConfig"
import {
  createStageSpotlightsMaterial,
  updateStageSpotlightsMaterial,
} from "./stageSpotlightsShader"

const StageSpotlights = () => {
  const meshRef = useRef<THREE.Mesh>(null)
  const material = useMemo(() => createStageSpotlightsMaterial(), [])

  const { enabled, opacity } = useControls("Stage Spotlights", {
    enabled: true,
    opacity: { value: SPOTS_OPACITY, min: 0, max: 0.5, step: 0.01 },
  })

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.visible = enabled
    if (!enabled) return
    updateStageSpotlightsMaterial(material, state.clock.elapsedTime, opacity)
  })

  return (
    <mesh ref={meshRef} renderOrder={999} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <primitive attach="material" object={material} />
    </mesh>
  )
}

export default StageSpotlights
