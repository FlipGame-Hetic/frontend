import { useFrame } from "@react-three/fiber"
import { useMemo } from "react"
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
  chargeRef: React.RefObject<number>
  color: string
}

const PlungerNeonTip = ({ mesh, chargeRef, color }: PlungerNeonTipProps) => {
  const bodyMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#0b0e14",
        metalness: 0.85,
        roughness: 0.35,
      }),
    [],
  )

  const styledMesh = useMemo(() => {
    if (!mesh) return null
    mesh.traverse((child) => {
      if (child instanceof Mesh) {
        child.material = bodyMaterial
      }
    })
    return mesh
  }, [mesh, bodyMaterial])

  const rimMaterials = useMemo(
    () =>
      PLUNGER_TIP_RIM_OFFSETS.map((_, i) =>
        createEnergyRingMaterial(i * 0.5, PLUNGER_TIP_RIM_INTENSITY, color),
      ),
    [color],
  )

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
        <mesh rotation={[Math.PI / 2, 0, 0]} material={bodyMaterial}>
          <cylinderGeometry
            args={[PLUNGER_ROD_RADIUS, PLUNGER_ROD_RADIUS, PLUNGER_ROD_LENGTH, 16]}
          />
        </mesh>
      )}
      {PLUNGER_TIP_RIM_OFFSETS.map((offset, i) => (
        <mesh key={offset} position={[0, 0, offset]} material={rimMaterials[i]}>
          <torusGeometry args={[PLUNGER_TIP_RIM_RADIUS, PLUNGER_TIP_RIM_TUBE_RADIUS, 8, 32]} />
        </mesh>
      ))}
    </group>
  )
}

export default PlungerNeonTip
