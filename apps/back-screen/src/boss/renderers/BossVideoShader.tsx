import { useLayoutEffect, useRef } from "react"
import { VideoTexture } from "three"
import type { Mesh, ShaderMaterial } from "three"
import { useFrame, useThree } from "@react-three/fiber"
import { createBossMatrixMaterial } from "../bossMatrixShader"
import { BOSS_SHADER_CONFIG } from "../bossShaderConfig"
import { pickRandom } from "../bossDamageConfig"
import { resolveWarmClipUrl } from "../bossVideoPreload"
import type { BossClips } from "../bossConfig"
import { useBackScreenStore } from "@/stores/useBackScreenStore"

interface BossVideoShaderProps {
  clips: BossClips
}

const FX_SWAP_LEAD = 0.08

const BossVideoShader = ({ clips }: BossVideoShaderProps) => {
  const meshRef = useRef<Mesh>(null)
  const materialRef = useRef<ShaderMaterial | null>(null)
  const idleTextureRef = useRef<VideoTexture | null>(null)
  const fxTextureRef = useRef<VideoTexture | null>(null)
  const fxVideoRef = useRef<HTMLVideoElement | null>(null)
  const fxActiveRef = useRef(false)
  const fxHoldRef = useRef(false)
  const damageRef = useRef(0)
  const size = useThree((s) => s.size)

  useLayoutEffect(() => {
    const idleVideo = document.createElement("video")
    idleVideo.src = resolveWarmClipUrl(pickRandom(clips.idle) ?? "")
    idleVideo.loop = true
    idleVideo.muted = true
    idleVideo.playsInline = true
    idleVideo.autoplay = true
    idleVideo.crossOrigin = "anonymous"
    void idleVideo.play()

    const fxVideo = document.createElement("video")
    fxVideo.loop = false
    fxVideo.muted = true
    fxVideo.playsInline = true
    fxVideo.crossOrigin = "anonymous"
    fxVideoRef.current = fxVideo

    const idleTexture = new VideoTexture(idleVideo)
    const fxTexture = new VideoTexture(fxVideo)
    idleTextureRef.current = idleTexture
    fxTextureRef.current = fxTexture
    const material = createBossMatrixMaterial(idleTexture)
    materialRef.current = material

    const mesh = meshRef.current
    if (mesh) mesh.material = material

    let fxToken = 0
    let lastFx = ""

    const playFx = (src: string, hold: boolean) => {
      const token = ++fxToken
      lastFx = src
      fxHoldRef.current = hold
      fxVideo.src = resolveWarmClipUrl(src)
      damageRef.current = 1
      fxVideo
        .play()
        .then(() => {
          if (token !== fxToken) return
          if (material.uniforms.iChannel0) material.uniforms.iChannel0.value = fxTexture
          fxActiveRef.current = true
        })
        .catch(() => {
          if (token !== fxToken) return
          if (material.uniforms.iChannel0) material.uniforms.iChannel0.value = idleTexture
          fxActiveRef.current = false
        })
    }

    const pickDamage = (): string | undefined => {
      if (clips.damage.length <= 1) return pickRandom(clips.damage)
      let next = pickRandom(clips.damage)
      while (next === lastFx) next = pickRandom(clips.damage)
      return next
    }

    const unsubscribe = useBackScreenStore.subscribe((state, prev) => {
      if (state.bossDefeatedAt !== prev.bossDefeatedAt && state.bossDefeatedAt > 0) {
        if (!clips.death) return
        playFx(clips.death, true)
        return
      }

      if (state.lastDamage.at === prev.lastDamage.at) return
      if (!state.lastDamage.big || clips.damage.length === 0) return
      const next = pickDamage()
      if (!next) return
      playFx(next, false)
    })

    return () => {
      unsubscribe()
      material.dispose()
      idleTexture.dispose()
      fxTexture.dispose()
      idleVideo.pause()
      idleVideo.removeAttribute("src")
      idleVideo.load()
      fxVideo.pause()
      fxVideo.removeAttribute("src")
      fxVideo.load()
      materialRef.current = null
      idleTextureRef.current = null
      fxTextureRef.current = null
      fxVideoRef.current = null
      fxActiveRef.current = false
      fxHoldRef.current = false
      damageRef.current = 0
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

  useFrame((state, delta) => {
    const material = materialRef.current
    if (!material) return

    const iTime = material.uniforms.iTime
    if (iTime) iTime.value = state.clock.elapsedTime

    const uDamage = material.uniforms.uDamage
    if (uDamage) {
      damageRef.current = Math.max(
        0,
        damageRef.current - delta / BOSS_SHADER_CONFIG.damageDecaySeconds,
      )
      uDamage.value = damageRef.current
    }

    if (fxActiveRef.current && !fxHoldRef.current) {
      const fxVideo = fxVideoRef.current
      const idleTexture = idleTextureRef.current
      if (fxVideo && idleTexture) {
        const reachedEnd =
          fxVideo.ended ||
          (fxVideo.duration > 0 && fxVideo.currentTime >= fxVideo.duration - FX_SWAP_LEAD)
        if (reachedEnd) {
          if (material.uniforms.iChannel0) material.uniforms.iChannel0.value = idleTexture
          fxActiveRef.current = false
        }
      }
    }
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  )
}

export default BossVideoShader
