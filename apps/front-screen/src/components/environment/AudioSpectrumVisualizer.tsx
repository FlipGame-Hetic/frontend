import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import type * as THREE from "three"
import { getAudioReactive } from "@/audio/audioReactive"
import { SPECTRUM_POSITION, SPECTRUM_SIZE } from "@/audio/audioReactiveConfig"
import { createAudioSpectrumMaterial, updateAudioSpectrumMaterial } from "./audioSpectrumShader"

const AudioSpectrumVisualizer = () => {
  const meshRef = useRef<THREE.Mesh>(null)
  const material = useMemo(() => createAudioSpectrumMaterial(), [])

  useFrame((state) => {
    if (!meshRef.current) return
    updateAudioSpectrumMaterial(material, state.clock.elapsedTime, getAudioReactive())
  })

  return (
    <mesh
      ref={meshRef}
      position={SPECTRUM_POSITION}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={2}
    >
      <planeGeometry args={[SPECTRUM_SIZE, SPECTRUM_SIZE]} />
      <primitive attach="material" object={material} />
    </mesh>
  )
}

export default AudioSpectrumVisualizer
