import { Line } from "@react-three/drei"
import { useMemo } from "react"
import { MathUtils } from "three"
import { DEMO_CAMERA_PATHS, getDemoCameraPath, sampleDemoCameraPath } from "./demoPaths"

interface DemoPathDebugProps {
  pathIndex: number
  scrub: number
}

const DemoPathDebug = ({ pathIndex, scrub }: DemoPathDebugProps) => {
  const selectedPathIndex = MathUtils.clamp(Math.round(pathIndex), 0, DEMO_CAMERA_PATHS.length - 1)
  const selectedPath = getDemoCameraPath(selectedPathIndex)
  const selectedSample = sampleDemoCameraPath(selectedPath, MathUtils.clamp(scrub, 0, 1))

  const debugCurves = useMemo(
    () =>
      DEMO_CAMERA_PATHS.map((path) => ({
        id: path.id,
        positionPoints: path.positionCurve.getPoints(80),
        lookAtPoints: path.lookAtCurve.getPoints(80),
      })),
    [],
  )

  return (
    <>
      {debugCurves.map((path, index) => {
        const selected = index === selectedPathIndex
        return (
          <group key={path.id}>
            <Line
              points={path.positionPoints}
              color={selected ? "#00f0ff" : "#4f7d8a"}
              lineWidth={selected ? 2 : 1}
              transparent
              opacity={selected ? 0.95 : 0.4}
            />
            <Line
              points={path.lookAtPoints}
              color={selected ? "#ff2d6b" : "#7a4454"}
              lineWidth={1}
              transparent
              opacity={selected ? 0.68 : 0.25}
            />
          </group>
        )
      })}
      <mesh position={selectedSample.position}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#ffe156" />
      </mesh>
      <mesh position={selectedSample.lookAt}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshBasicMaterial color="#ff2d6b" />
      </mesh>
      <Line
        points={[selectedSample.position, selectedSample.lookAt]}
        color="#ffe156"
        lineWidth={1}
        transparent
        opacity={0.76}
      />
    </>
  )
}

export default DemoPathDebug
