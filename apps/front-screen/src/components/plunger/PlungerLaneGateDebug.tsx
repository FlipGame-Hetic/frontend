import { usePhysicsDebugControls } from "@/debug/physicsDebugContext"

const PlungerLaneGateDebug = () => {
  const { showGate, plungerGate } = usePhysicsDebugControls()

  if (!showGate) return null

  const [hx, hy, hz] = plungerGate.halfExtents

  return (
    <group>
      <mesh position={plungerGate.position} rotation={plungerGate.rotation}>
        <boxGeometry args={[hx * 2, hy * 2, hz * 2]} />
        <meshBasicMaterial color="cyan" wireframe />
      </mesh>
      <mesh position={plungerGate.position}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color="cyan" depthTest={false} />
      </mesh>
    </group>
  )
}

export default PlungerLaneGateDebug
