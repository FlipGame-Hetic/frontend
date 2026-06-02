import { useEffect, useMemo, useRef } from "react"
import type { Mesh } from "three"
import { createBallMaterial, updateBallMaterialColor } from "./ballMaterial"

const useBallMaterial = (color: string) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mat = useMemo(() => createBallMaterial(color), [])
  const meshRef = useRef<Mesh>(null)

  useEffect(() => {
    if (meshRef.current) meshRef.current.material = mat
  }, [mat])

  useEffect(() => {
    updateBallMaterialColor(mat, color)
  }, [mat, color])

  return meshRef
}

export default useBallMaterial
