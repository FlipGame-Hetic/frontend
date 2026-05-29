import { useMemo } from "react"
import { Color, DoubleSide, ShaderMaterial } from "three"
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

const PortalSurface = ({ portalId }: PortalSurfaceProps) => {
  const size = PORTAL_SIZE[portalId]
  const pos = getPortalFrontFacePosition(portalId)
  const rot = getPortalRotation(portalId)
  const [r, g, b] = PORTAL_TINT[portalId]

  const material = useMemo(
    () =>
      new ShaderMaterial({
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
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <mesh position={pos} rotation={rot} material={material}>
      <planeGeometry args={[size, size]} />
    </mesh>
  )
}

export default PortalSurface
