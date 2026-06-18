import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import type { Group, MeshBasicMaterial } from "three"
import { AdditiveBlending, Color, Quaternion, Vector3 } from "three"
import {
  getChargeColor,
  PLUNGER_BEAM_CORE_RADIUS,
  PLUNGER_BEAM_DURATION,
  PLUNGER_BEAM_LENGTH,
  PLUNGER_BEAM_ORIGIN_OFFSET,
  PLUNGER_BEAM_OUTER_RADIUS,
  PLUNGER_VFX_HDR_FACTOR,
} from "./plungerVfxConfig"
import type { PlungerLaunchState } from "./usePlungerSimulation"

interface PlungerBeamProps {
  launchRef: React.RefObject<PlungerLaunchState>
  movementAxis: Vector3
  color: string
}

const CORE_COLOR = new Color("#FFFFFF").multiplyScalar(PLUNGER_VFX_HDR_FACTOR)

const PlungerBeam = ({ launchRef, movementAxis, color }: PlungerBeamProps) => {
  const groupRef = useRef<Group | null>(null)
  const coreMaterialRef = useRef<MeshBasicMaterial | null>(null)
  const outerMaterialRef = useRef<MeshBasicMaterial | null>(null)
  const lastTokenRef = useRef(0)
  const lifeRef = useRef(0)
  const launchChargeRef = useRef(0)

  const orientation = useMemo(
    () => new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), movementAxis),
    [movementAxis],
  )
  const hotColor = useMemo(() => new Color(color), [color])

  useFrame((_, delta) => {
    const group = groupRef.current
    const coreMaterial = coreMaterialRef.current
    const outerMaterial = outerMaterialRef.current
    const launch = launchRef.current
    if (!group || !coreMaterial || !outerMaterial) return

    if (launch.token !== lastTokenRef.current) {
      lastTokenRef.current = launch.token
      lifeRef.current = PLUNGER_BEAM_DURATION
      launchChargeRef.current = launch.charge
      getChargeColor(launch.charge, outerMaterial.color, hotColor).multiplyScalar(
        PLUNGER_VFX_HDR_FACTOR,
      )
    }

    if (lifeRef.current <= 0) {
      group.visible = false
      return
    }

    lifeRef.current -= delta
    const k = Math.max(lifeRef.current / PLUNGER_BEAM_DURATION, 0)
    const radiusScale = (0.5 + launchChargeRef.current) * (0.4 + 0.6 * k)

    group.visible = true
    group.scale.set(radiusScale, radiusScale, 1)
    coreMaterial.opacity = 0.9 * k
    outerMaterial.opacity = 0.55 * k
  })

  return (
    <group ref={groupRef} quaternion={orientation} visible={false}>
      <group position={[0, 0, -PLUNGER_BEAM_ORIGIN_OFFSET]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -PLUNGER_BEAM_LENGTH / 2]}>
          <cylinderGeometry
            args={[
              PLUNGER_BEAM_OUTER_RADIUS,
              PLUNGER_BEAM_OUTER_RADIUS,
              PLUNGER_BEAM_LENGTH,
              16,
              1,
              true,
            ]}
          />
          <meshBasicMaterial
            ref={outerMaterialRef}
            transparent
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
            opacity={0}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -PLUNGER_BEAM_LENGTH / 2]}>
          <cylinderGeometry
            args={[
              PLUNGER_BEAM_CORE_RADIUS,
              PLUNGER_BEAM_CORE_RADIUS,
              PLUNGER_BEAM_LENGTH,
              12,
              1,
              true,
            ]}
          />
          <meshBasicMaterial
            ref={coreMaterialRef}
            color={CORE_COLOR}
            transparent
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
            opacity={0}
          />
        </mesh>
      </group>
    </group>
  )
}

export default PlungerBeam
