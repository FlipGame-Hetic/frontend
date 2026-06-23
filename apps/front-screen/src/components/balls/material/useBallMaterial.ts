import { useEffect, useMemo, useRef } from "react"
import type { Mesh } from "three"
import { createBallMaterial, updateBallMaterialColor } from "./ballMaterial"

const useBallMaterial = (color: string) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mat = useMemo(() => createBallMaterial(color), [])
  const meshRef = useRef<Mesh>(null)
  const disposeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (meshRef.current) meshRef.current.material = mat
  }, [mat])

  useEffect(() => {
    updateBallMaterialColor(mat, color)
  }, [mat, color])

  useEffect(() => {
    if (disposeTimeoutRef.current !== null) {
      clearTimeout(disposeTimeoutRef.current)
      disposeTimeoutRef.current = null
    }

    return () => {
      disposeTimeoutRef.current = setTimeout(() => {
        mat.dispose()
        disposeTimeoutRef.current = null
      }, 0)
    }
  }, [mat])

  return meshRef
}

export default useBallMaterial
