import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"
import { getAudioReactive } from "@/audio/audioReactive"
import {
  AMBIENT_BASE_INTENSITY,
  AMBIENT_BEAT_BOOST,
  AMBIENT_COLOR_BLEND,
  AMBIENT_SWELL_STRENGTH,
} from "@/audio/audioReactiveConfig"

const ReactiveAmbientLight = () => {
  const ref = useRef<THREE.AmbientLight>(null)

  useFrame(() => {
    const light = ref.current
    if (!light) return
    const { swell, beat, color } = getAudioReactive()
    light.intensity = Math.min(
      0.98,
      AMBIENT_BASE_INTENSITY + swell * AMBIENT_SWELL_STRENGTH + beat * AMBIENT_BEAT_BOOST,
    )
    const blend = swell * AMBIENT_COLOR_BLEND
    light.color.setRGB(
      THREE.MathUtils.lerp(1, color.r, blend),
      THREE.MathUtils.lerp(1, color.g, blend),
      THREE.MathUtils.lerp(1, color.b, blend),
    )
  })

  return <ambientLight ref={ref} intensity={AMBIENT_BASE_INTENSITY} />
}

export default ReactiveAmbientLight
