import { useFrame } from "@react-three/fiber"
import { useControls } from "leva"
import { useMemo, useRef } from "react"
import type * as THREE from "three"
import { getAudioReactive } from "@/audio/audioReactive"
import { SPECTRUM_POSITION, SPECTRUM_SIZE } from "@/audio/audioReactiveConfig"
import { createAudioSpectrumMaterial, updateAudioSpectrumMaterial } from "./audioSpectrumShader"

const AudioSpectrumVisualizer = () => {
  const meshRef = useRef<THREE.Mesh>(null)
  const material = useMemo(() => createAudioSpectrumMaterial(), [])

  const { vizEnabled, positionY, size } = useControls("Audio Reactive", {
    vizEnabled: { value: true, label: "Visualizer enabled" },
    positionY: { value: SPECTRUM_POSITION[1], min: -10, max: 5, step: 0.05 },
    size: { value: SPECTRUM_SIZE, min: 20, max: 200, step: 5 },
  })

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.visible = vizEnabled
    if (!vizEnabled) return
    updateAudioSpectrumMaterial(material, state.clock.elapsedTime, getAudioReactive())
  })

  return (
    <mesh
      ref={meshRef}
      position={[SPECTRUM_POSITION[0], positionY, SPECTRUM_POSITION[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={2}
    >
      <planeGeometry args={[size, size]} />
      <primitive attach="material" object={material} />
    </mesh>
  )
}

export default AudioSpectrumVisualizer
