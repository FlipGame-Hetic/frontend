import { SpotLight } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"
import { getAudioReactive } from "@/audio/audioReactive"
import {
  SPOT_A_POSITION,
  SPOT_ANGLE,
  SPOT_ANGLE_POWER,
  SPOT_ATTENUATION,
  SPOT_B_POSITION,
  SPOT_BASE_INTENSITY,
  SPOT_DECAY,
  SPOT_DISTANCE,
  SPOT_DROP_BOOST,
  SPOT_PENUMBRA,
  SPOT_SWELL_STRENGTH,
  SPOT_VOLUMETRIC_OPACITY,
  SPOTS_OPACITY,
} from "@/audio/audioReactiveConfig"
import { createSpotlightMotion, updateSpotlightMotion } from "./spotlightMotion"
import {
  createStageSpotlightsMaterial,
  updateStageSpotlightsMaterial,
} from "./stageSpotlightsShader"

const StageSpotlights = () => {
  const spotA = useRef<THREE.SpotLight>(null)
  const spotB = useRef<THREE.SpotLight>(null)
  const targetA = useRef<THREE.Object3D>(null)
  const targetB = useRef<THREE.Object3D>(null)

  const material = useMemo(() => createStageSpotlightsMaterial(), [])
  const motionA = useMemo(() => createSpotlightMotion(), [])
  const motionB = useMemo(() => createSpotlightMotion(), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, dt) => {
    const { color, swell, dropPulse } = getAudioReactive()
    const intensity =
      SPOT_BASE_INTENSITY + swell * SPOT_SWELL_STRENGTH + dropPulse * SPOT_DROP_BOOST

    if (spotA.current && targetA.current) {
      spotA.current.color.copy(color)
      spotA.current.intensity = intensity
      spotA.current.target = targetA.current
      updateSpotlightMotion(motionA, dt, tmp)
      targetA.current.position.copy(tmp)
    }
    if (spotB.current && targetB.current) {
      spotB.current.color.copy(color)
      spotB.current.intensity = intensity
      spotB.current.target = targetB.current
      updateSpotlightMotion(motionB, dt, tmp)
      targetB.current.position.copy(tmp)
    }

    updateStageSpotlightsMaterial(material, state.clock.elapsedTime, SPOTS_OPACITY, color)
  })

  return (
    <>
      <object3D ref={targetA} />
      <object3D ref={targetB} />
      <SpotLight
        ref={spotA}
        position={SPOT_A_POSITION}
        angle={SPOT_ANGLE}
        penumbra={SPOT_PENUMBRA}
        distance={SPOT_DISTANCE}
        decay={SPOT_DECAY}
        attenuation={SPOT_ATTENUATION}
        anglePower={SPOT_ANGLE_POWER}
        intensity={SPOT_BASE_INTENSITY}
        opacity={SPOT_VOLUMETRIC_OPACITY}
        color="#00f0ff"
      />
      <SpotLight
        ref={spotB}
        position={SPOT_B_POSITION}
        angle={SPOT_ANGLE}
        penumbra={SPOT_PENUMBRA}
        distance={SPOT_DISTANCE}
        decay={SPOT_DECAY}
        attenuation={SPOT_ATTENUATION}
        anglePower={SPOT_ANGLE_POWER}
        intensity={SPOT_BASE_INTENSITY}
        opacity={SPOT_VOLUMETRIC_OPACITY}
        color="#ff2d6b"
      />
      <mesh renderOrder={999} frustumCulled={false}>
        <planeGeometry args={[2, 2]} />
        <primitive attach="material" object={material} />
      </mesh>
    </>
  )
}

export default StageSpotlights
