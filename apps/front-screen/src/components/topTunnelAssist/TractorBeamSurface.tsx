import { useLayoutEffect, useRef } from "react"
import { AdditiveBlending, Color, DoubleSide, type Mesh, ShaderMaterial } from "three"
import { useFrame } from "@react-three/fiber"
import { VERTEX_SHADER, FRAGMENT_SHADER } from "./tractorBeamShader"
import { TOP_TUNNEL_ENTRY_TRACTOR } from "./topTunnelAssistConfig"
import { PLUNGER_VFX_HDR_FACTOR } from "../plunger/effects/plungerVfxConfig"

const TRACTOR_BEAM_COLOR: [number, number, number] = [0.0, 0.5, 1.0]

const createTractorBeamMaterial = () => {
  return new ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new Color().setRGB(...TRACTOR_BEAM_COLOR) },
      uHdr: { value: PLUNGER_VFX_HDR_FACTOR },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    toneMapped: false,
  })
}

const TractorBeamSurface = () => {
  const { radius, halfHeight, position, rotation } = TOP_TUNNEL_ENTRY_TRACTOR

  const meshRef = useRef<Mesh>(null)
  const materialRef = useRef<ShaderMaterial | null>(null)

  useLayoutEffect(() => {
    const material = createTractorBeamMaterial()
    materialRef.current = material
    const mesh = meshRef.current
    if (mesh) mesh.material = material

    return () => {
      material.dispose()
      materialRef.current = null
    }
  }, [])

  useFrame((state) => {
    const material = materialRef.current
    if (!material) return
    const uTime = material.uniforms.uTime
    if (uTime) uTime.value = state.clock.elapsedTime
  })

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <coneGeometry args={[radius, halfHeight * 2, 48, 1, true]} />
    </mesh>
  )
}

export default TractorBeamSurface
