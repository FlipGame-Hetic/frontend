import { useFrame } from "@react-three/fiber"
import { updateAudioReactive } from "@/audio/audioReactive"

const AudioReactiveController = () => {
  useFrame((_, delta) => {
    updateAudioReactive(delta)
  })

  return null
}

export default AudioReactiveController
