import { Physics } from "@react-three/rapier"
import Walls from "./components/Walls"
import World from "./components/World"

export default function App() {
  return (
    <>
      <World cameraSettings={{ position: [0, 20, 25], fov: 35 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        {/* Debug only - will be toggleable with Leva GUI */}
        {/* <OrbitControls /> */}

        <Physics debug>
          <Walls />
        </Physics>
      </World>
    </>
  )
}
