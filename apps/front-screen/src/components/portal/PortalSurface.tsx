import { useLayoutEffect, useRef } from "react"
import { Color, DoubleSide, type Mesh, ShaderMaterial } from "three"
import { useFrame } from "@react-three/fiber"
import { VERTEX_SHADER, FRAGMENT_SHADER } from "./portalShader"
import {
  getPortalFrontFacePosition,
  getPortalRotation,
  PORTAL_SIZE,
  type PortalId,
} from "./portalConfig"

interface PortalSurfaceProps {
  portalId: PortalId
}

const PORTAL_TINT: Record<PortalId, [number, number, number]> = {
  A: [0.0, 0.5, 1.0],
  B: [0.961, 0.592, 0.078],
}

const createPortalMaterial = (r: number, g: number, b: number) => {
  return new ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      uTime: { value: 0 },
      uTintColor: { value: new Color().setRGB(r, g, b) },
    },
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
    side: DoubleSide,
  })
}

const PortalSurface = ({ portalId }: PortalSurfaceProps) => {
  const size = PORTAL_SIZE[portalId]
  const pos = getPortalFrontFacePosition(portalId)
  const rot = getPortalRotation(portalId)
  const [r, g, b] = PORTAL_TINT[portalId]

  const meshRef = useRef<Mesh>(null)
  const materialRef = useRef<ShaderMaterial | null>(null)

  useLayoutEffect(() => {
    const material = createPortalMaterial(r, g, b)
    materialRef.current = material
    const mesh = meshRef.current
    if (mesh) mesh.material = material

    return () => {
      material.dispose()
      materialRef.current = null
    }
  }, [r, g, b])

  useFrame((state) => {
    const material = materialRef.current
    if (!material) return
    const uTime = material.uniforms.uTime
    if (uTime) uTime.value = state.clock.elapsedTime
  })

  return (
    <mesh ref={meshRef} position={pos} rotation={rot}>
      <planeGeometry args={[size, size]} />
    </mesh>
  )
}

export default PortalSurface
