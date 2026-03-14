import { Physics } from "@react-three/rapier"
import Walls from "./components/Walls"
import World from "./components/World"

export default function App() {
  return (
    <>
      {/* <WebsocketTest /> */}
      <World cameraSettings={{ position: [5, 5, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        <Physics debug>
          <Walls />
        </Physics>
      </World>
    </>
  )
}
