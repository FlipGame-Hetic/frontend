import { useThree } from "@react-three/fiber"
import { useRapier } from "@react-three/rapier"
import { useEffect } from "react"

declare global {
  interface Window {
    __three?: ReturnType<typeof useThree>
    __rapier?: ReturnType<typeof useRapier>
  }
}

const DebugBridge = () => {
  const three = useThree()
  const rapier = useRapier()

  useEffect(() => {
    window.__three = three
    window.__rapier = rapier
  }, [three, rapier])

  return null
}

export default DebugBridge
