import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import type { Mesh, MeshBasicMaterial } from "three"
import { AdditiveBlending, Color, DoubleSide, Quaternion, Vector3 } from "three"
import {
  getChargeColor,
  PLUNGER_SHOCKWAVE_DURATION,
  PLUNGER_SHOCKWAVE_MAX_RADIUS,
  PLUNGER_SHOCKWAVE_ORIGIN_OFFSET,
  PLUNGER_VFX_HDR_FACTOR,
} from "./plungerVfxConfig"
import type { PlungerLaunchState } from "../simulation/usePlungerSimulation"

interface PlungerShockwaveProps {
  launchRef: React.RefObject<PlungerLaunchState>
  movementAxis: Vector3
  color: string
}

const PlungerShockwave = ({ launchRef, movementAxis, color }: PlungerShockwaveProps) => {
  const meshRef = useRef<Mesh | null>(null)
  const materialRef = useRef<MeshBasicMaterial | null>(null)
  const lastTokenRef = useRef(0)
  const lifeRef = useRef(0)

  const orientation = useMemo(
    () => new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), movementAxis),
    [movementAxis],
  )
  const hotColor = useMemo(() => new Color(color), [color])

  useFrame((_, delta) => {
    const mesh = meshRef.current
    const material = materialRef.current
    const launch = launchRef.current
    if (!mesh || !material) return

    if (launch.token !== lastTokenRef.current) {
      lastTokenRef.current = launch.token
      lifeRef.current = PLUNGER_SHOCKWAVE_DURATION
      getChargeColor(launch.charge, material.color, hotColor).multiplyScalar(PLUNGER_VFX_HDR_FACTOR)
    }

    if (lifeRef.current <= 0) {
      mesh.visible = false
      return
    }

    lifeRef.current -= delta
    const progress = 1 - Math.max(lifeRef.current / PLUNGER_SHOCKWAVE_DURATION, 0)
    const eased = 1 - Math.pow(1 - progress, 3)
    const radius = 0.1 + (PLUNGER_SHOCKWAVE_MAX_RADIUS - 0.1) * eased

    mesh.visible = true
    mesh.scale.setScalar(radius)
    material.opacity = 0.8 * (1 - progress)
  })

  return (
    <group quaternion={orientation}>
      <mesh ref={meshRef} position={[0, 0, -PLUNGER_SHOCKWAVE_ORIGIN_OFFSET]} visible={false}>
        <ringGeometry args={[0.75, 1, 48]} />
        <meshBasicMaterial
          ref={materialRef}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          side={DoubleSide}
          opacity={0}
        />
      </mesh>
    </group>
  )
}

export default PlungerShockwave
