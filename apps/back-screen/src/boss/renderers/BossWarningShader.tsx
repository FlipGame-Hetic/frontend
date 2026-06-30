import { useLayoutEffect, useRef } from "react"
import { DataTexture, RGBAFormat } from "three"
import type { Mesh, ShaderMaterial } from "three"
import { useFrame, useThree } from "@react-three/fiber"
import { createBossMatrixMaterial } from "../bossMatrixShader"

const BossWarningShader = () => {
  const meshRef = useRef<Mesh>(null)
  const materialRef = useRef<ShaderMaterial | null>(null)
  const size = useThree((s) => s.size)

  useLayoutEffect(() => {
    const whiteTexture = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, RGBAFormat)
    whiteTexture.needsUpdate = true

    const material = createBossMatrixMaterial(whiteTexture)
    if (material.uniforms.uDamage) material.uniforms.uDamage.value = 1
    materialRef.current = material

    const mesh = meshRef.current
    if (mesh) mesh.material = material

    return () => {
      material.dispose()
      whiteTexture.dispose()
      materialRef.current = null
    }
  }, [])

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

export default BossWarningShader
