import { RigidBody } from "@react-three/rapier"
import type { Mesh } from "three"

interface SensorsManagerProps {
  nodes: Mesh[]
}

const SensorsManager = ({ nodes }: SensorsManagerProps) => {
  return (
    <>
      {nodes.length > 0 && (
        <RigidBody type="fixed" colliders="trimesh" sensor>
          {nodes.map((mesh) => (
            <primitive key={mesh.uuid} object={mesh} />
          ))}
        </RigidBody>
      )}
    </>
  )
}

export default SensorsManager
