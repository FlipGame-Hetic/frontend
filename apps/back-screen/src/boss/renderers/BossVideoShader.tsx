import { useLayoutEffect, useRef } from "react"
import { VideoTexture } from "three"
import type { Mesh, ShaderMaterial } from "three"
import { useFrame, useThree } from "@react-three/fiber"
import { createBossMatrixMaterial } from "../bossMatrixShader"
import { pickRandom } from "../bossDamageConfig"
import type { BossClips } from "../bossConfig"
import { useBackScreenStore } from "@/stores/useBackScreenStore"

interface BossVideoShaderProps {
  clips: BossClips
}

const BossVideoShader = ({ clips }: BossVideoShaderProps) => {
  const meshRef = useRef<Mesh>(null)
  const materialRef = useRef<ShaderMaterial | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const size = useThree((s) => s.size)

  useLayoutEffect(() => {
    const video = document.createElement("video")
    video.src = pickRandom(clips.idle) ?? ""
    video.loop = true
    video.muted = true
    video.playsInline = true
    video.autoplay = true
    video.crossOrigin = "anonymous"
    void video.play()
    videoRef.current = video

    const texture = new VideoTexture(video)
    const material = createBossMatrixMaterial(texture)
    materialRef.current = material

    const mesh = meshRef.current
    if (mesh) mesh.material = material

    const playIdle = () => {
      video.onended = null
      video.src = pickRandom(clips.idle) ?? ""
      video.loop = true
      void video.play()
    }

    const unsubscribe = useBackScreenStore.subscribe((state, prev) => {
      if (state.lastDamage.at === prev.lastDamage.at) return
      if (!state.lastDamage.big || clips.damage.length === 0) return
      const next = pickRandom(clips.damage)
      if (!next) return
      video.loop = false
      video.src = next
      video.onended = playIdle
      void video.play()
    })

    return () => {
      unsubscribe()
      material.dispose()
      texture.dispose()
      video.onended = null
      video.pause()
      video.removeAttribute("src")
      video.load()
      materialRef.current = null
      videoRef.current = null
    }
  }, [clips])

  useLayoutEffect(() => {
    const material = materialRef.current
    if (!material) return
    const iResolution = material.uniforms.iResolution
    if (iResolution) {
      ;(iResolution.value as { set: (x: number, y: number) => void }).set(size.width, size.height)
    }
  }, [size.width, size.height])

  useFrame((state) => {
    const material = materialRef.current
    if (!material) return
    const iTime = material.uniforms.iTime
    if (iTime) iTime.value = state.clock.elapsedTime
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  )
}

export default BossVideoShader
