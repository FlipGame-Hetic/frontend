import { useFrame } from "@react-three/fiber"
import { useControls } from "leva"
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

  const { ambientEnabled, swellStrength, beatBoost, colorBlend } = useControls("Audio Reactive", {
    ambientEnabled: { value: true, label: "Ambient enabled" },
    swellStrength: { value: AMBIENT_SWELL_STRENGTH, min: 0, max: 1, step: 0.01 },
    beatBoost: { value: AMBIENT_BEAT_BOOST, min: 0, max: 0.5, step: 0.01 },
    colorBlend: { value: AMBIENT_COLOR_BLEND, min: 0, max: 1, step: 0.01 },
  })

  useFrame(() => {
    const light = ref.current
    if (!light || !ambientEnabled) {
      if (light) {
        light.intensity = AMBIENT_BASE_INTENSITY
        light.color.setRGB(1, 1, 1)
      }
      return
    }
    const { swell, beat, color } = getAudioReactive()
    const intensity = AMBIENT_BASE_INTENSITY + swell * swellStrength + beat * beatBoost
    light.intensity = Math.min(0.98, intensity)
    light.color.setRGB(
      THREE.MathUtils.lerp(1, color.r, swell * colorBlend),
      THREE.MathUtils.lerp(1, color.g, swell * colorBlend),
      THREE.MathUtils.lerp(1, color.b, swell * colorBlend),
    )
  })

  return <ambientLight ref={ref} intensity={AMBIENT_BASE_INTENSITY} />
}

export default ReactiveAmbientLight
