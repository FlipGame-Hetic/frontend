import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import type * as THREE from "three"
import { getAudioReactive } from "@/audio/audioReactive"
import {
  ACCENT_BASE_INTENSITY,
  ACCENT_DROP_BOOST,
  ACCENT_POSITION,
  ACCENT_SWELL_STRENGTH,
} from "@/audio/audioReactiveConfig"

const ReactiveAccentLight = () => {
  const ref = useRef<THREE.DirectionalLight>(null)

  useFrame(() => {
    const light = ref.current
    if (!light) return
    const { swell, dropPulse, color } = getAudioReactive()
    light.intensity =
      ACCENT_BASE_INTENSITY + swell * ACCENT_SWELL_STRENGTH + dropPulse * ACCENT_DROP_BOOST
    light.color.copy(color)
  })

  return <directionalLight ref={ref} position={ACCENT_POSITION} intensity={ACCENT_BASE_INTENSITY} />
}

export default ReactiveAccentLight
