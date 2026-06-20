import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Mesh } from "three"
import { createBallMaterial, updateBallMaterialColor } from "./characterBallMaterial"

const SPIN_SPEED = 0.4

export default function CharacterBallMesh({ color }: { color: string }) {
  const meshRef = useRef<Mesh>(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const material = useMemo(() => createBallMaterial(color), [])

  useEffect(() => {
    updateBallMaterialColor(material, color)
  }, [material, color])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += delta * SPIN_SPEED
    meshRef.current.rotation.z += delta * (SPIN_SPEED / 2.5)
  })

  return (
    <mesh ref={meshRef} material={material}>
      <sphereGeometry args={[1, 32, 32]} />
    </mesh>
  )
}
