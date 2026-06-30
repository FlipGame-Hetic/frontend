import { useFrame } from "@react-three/fiber"
import { useMemo, useRef, type RefObject } from "react"
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
import type { PlungerLaunchState } from "../simulation/usePlungerSimulation"

interface PlungerBeamProps {
  launchRef: RefObject<PlungerLaunchState>
  movementAxis: Vector3
  color: string
}

// White core multiplied past 1 so the bloom pass picks it up and makes it glow
const CORE_COLOR = new Color("#FFFFFF").multiplyScalar(PLUNGER_VFX_HDR_FACTOR)

const PlungerBeam = ({ launchRef, movementAxis, color }: PlungerBeamProps) => {
  const groupRef = useRef<Group | null>(null)
  const coreMaterialRef = useRef<MeshBasicMaterial | null>(null)
  const outerMaterialRef = useRef<MeshBasicMaterial | null>(null)
  // Last launch token we reacted to, so the beam fires once per launch
  const lastTokenRef = useRef(0)
  // Seconds of beam left to play, 0 means hidden
  const lifeRef = useRef(0)
  // Charge of the launch that spawned the current beam, drives its thickness
  const launchChargeRef = useRef(0)

  // Rotation that points the beam, built for +Z, up the travel axis
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

    // New launch, restart the beam life and tint the sleeve by how hard the launch was
    if (launch.token !== lastTokenRef.current) {
      lastTokenRef.current = launch.token
      lifeRef.current = PLUNGER_BEAM_DURATION
      launchChargeRef.current = launch.charge
      getChargeColor(launch.charge, outerMaterial.color, hotColor).multiplyScalar(
        PLUNGER_VFX_HDR_FACTOR,
      )
    }

    // Beam finished, hide it and stop
    if (lifeRef.current <= 0) {
      group.visible = false
      return
    }

    lifeRef.current -= delta
    // k runs from 1 at spawn down to 0 at the end, used to fade and thin the beam out
    const k = Math.max(lifeRef.current / PLUNGER_BEAM_DURATION, 0)
    // Thicker beam for a stronger launch, then it thins as it fades
    const radiusScale = (0.5 + launchChargeRef.current) * (0.4 + 0.6 * k)

    group.visible = true
    group.scale.set(radiusScale, radiusScale, 1)
    coreMaterial.opacity = 0.9 * k
    outerMaterial.opacity = 0.55 * k
  })

  return (
    <group ref={groupRef} quaternion={orientation} visible={false}>
      {/* Push the beam forward so it starts at the tip and shoots up the lane */}
      <group position={[0, 0, -PLUNGER_BEAM_ORIGIN_OFFSET]}>
        {/* Outer colored sleeve, open-ended cylinder, additive and depth-write off so it blends like light instead of a solid tube */}
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
        {/* Inner white-hot core, thinner and brighter than the sleeve */}
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
