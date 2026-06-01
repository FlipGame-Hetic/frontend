import { EffectComposer, Bloom } from "@react-three/postprocessing"
import { useControls } from "leva"
import {
  BLOOM_INTENSITY,
  BLOOM_LUMINANCE_SMOOTHING,
  BLOOM_LUMINANCE_THRESHOLD,
  BLOOM_RADIUS,
} from "./bloomConfig"

const PostProcessing = () => {
  const { intensity, luminanceThreshold, luminanceSmoothing, radius } = useControls("Bloom", {
    intensity: { value: BLOOM_INTENSITY, min: 0, max: 5, step: 0.05 },
    luminanceThreshold: { value: BLOOM_LUMINANCE_THRESHOLD, min: 0, max: 2, step: 0.05 },
    luminanceSmoothing: { value: BLOOM_LUMINANCE_SMOOTHING, min: 0, max: 1, step: 0.005 },
    radius: { value: BLOOM_RADIUS, min: 0, max: 1, step: 0.01 },
  })

  return (
    <EffectComposer>
      <Bloom
        intensity={intensity}
        luminanceThreshold={luminanceThreshold}
        luminanceSmoothing={luminanceSmoothing}
        mipmapBlur
        radius={radius}
      />
    </EffectComposer>
  )
}

export default PostProcessing
