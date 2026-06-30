import { useFrame } from "@react-three/fiber"
import { useMemo, type RefObject } from "react"
import { Mesh, MeshStandardMaterial } from "three"
import { PLUNGER_ROD_LENGTH, PLUNGER_ROD_RADIUS } from "../plungerConfig"
import { createEnergyRingMaterial, updateEnergyRingMaterial } from "./energyRingMaterial"
import {
  PLUNGER_TIP_RIM_INTENSITY,
  PLUNGER_TIP_RIM_OFFSETS,
  PLUNGER_TIP_RIM_RADIUS,
  PLUNGER_TIP_RIM_TUBE_RADIUS,
} from "./plungerVfxConfig"

interface PlungerNeonTipProps {
  mesh?: Mesh
  chargeRef: RefObject<number>
  color: string
}

// The physical-looking plunger head, a dark metal rod wrapped in glowing neon rim rings whose glow tracks the charge
const PlungerNeonTip = ({ mesh, chargeRef, color }: PlungerNeonTipProps) => {
  // Dark, fairly metallic body so the neon rings read as the only light source on the tip
  const bodyMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#0b0e14",
        metalness: 0.85,
        roughness: 0.35,
      }),
    [],
  )

  // Force the dark metal material onto every mesh of the imported model, the model ships with its own materials we do not want here
  const styledMesh = useMemo(() => {
    if (!mesh) return null
    mesh.traverse((child) => {
      if (child instanceof Mesh) {
        child.material = bodyMaterial
      }
    })
    return mesh
  }, [mesh, bodyMaterial])

  // One animated shader material per rim ring, the i * 0.5 staggers their phase so they do not all pulse in sync
  const rimMaterials = useMemo(
    () =>
      PLUNGER_TIP_RIM_OFFSETS.map((_, i) =>
        createEnergyRingMaterial(i * 0.5, PLUNGER_TIP_RIM_INTENSITY, color),
      ),
    [color],
  )

  // Feed the clock and current charge into each rim shader every frame, the last 0 means no launch flash here
  useFrame((state) => {
    const charge = chargeRef.current
    for (const material of rimMaterials) {
      updateEnergyRingMaterial(material, state.clock.elapsedTime, charge, 0)
    }
  })

  return (
    <group>
      {styledMesh ? (
        <primitive object={styledMesh} />
      ) : (
        // No model tip was provided, draw a plain cylinder the size of the rod collider as a fallback
        <mesh rotation={[Math.PI / 2, 0, 0]} material={bodyMaterial}>
          <cylinderGeometry
            args={[PLUNGER_ROD_RADIUS, PLUNGER_ROD_RADIUS, PLUNGER_ROD_LENGTH, 16]}
          />
        </mesh>
      )}
      {/* The neon rim rings spaced along the tip, each gets its own staggered shader material */}
      {PLUNGER_TIP_RIM_OFFSETS.map((offset, i) => (
        <mesh key={offset} position={[0, 0, offset]} material={rimMaterials[i]}>
          <torusGeometry args={[PLUNGER_TIP_RIM_RADIUS, PLUNGER_TIP_RIM_TUBE_RADIUS, 8, 32]} />
        </mesh>
      ))}
    </group>
  )
}

export default PlungerNeonTip
