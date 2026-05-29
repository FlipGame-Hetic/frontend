import useKeyboard from "@/hooks/useKeyboard"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { useMemo } from "react"
import { Vector3 } from "three"
import {
  PLUNGER_LANE_FRICTION,
  PLUNGER_POSITION,
  PLUNGER_ROD_LENGTH,
  PLUNGER_ROD_RADIUS,
  PLUNGER_SPRING_RADIUS,
  PLUNGER_SPRING_SPACING,
  PLUNGER_SPRING_TORUS_COUNT,
  PLUNGER_SPRING_TUBE_RADIUS,
} from "./plungerConfig"
import { type PlungerMeshPart, usePlungerSimulation } from "./usePlungerSimulation"

export type { PlungerMeshPart }

interface PlungerProps {
  position?: [number, number, number]
  tipMesh?: PlungerMeshPart
  ringMeshes?: PlungerMeshPart[]
}

const toVector3 = (position: [number, number, number]): Vector3 => {
  return new Vector3(position[0], position[1], position[2])
}

const Plunger = ({ position = PLUNGER_POSITION, tipMesh, ringMeshes = [] }: PlungerProps) => {
  const pressedKeys = useKeyboard()

  const rootPosition = useMemo(() => toVector3(position), [position])
  const tipRestPosition = useMemo(
    () => toVector3(tipMesh?.position ?? [0, 0, 0]),
    [tipMesh?.position],
  )
  const ringRestPositions = useMemo(
    () => ringMeshes.map((part) => toVector3(part.position)),
    [ringMeshes],
  )
  const movementAxis = useMemo(() => {
    const backRing = ringRestPositions.at(-1)
    if (!backRing) return new Vector3(0, 0, 1)
    const axis = backRing.clone().sub(tipRestPosition)
    if (axis.lengthSq() === 0) return new Vector3(0, 0, 1)
    return axis.normalize()
  }, [ringRestPositions, tipRestPosition])

  const { tipGroupRef, rodBodyRef, torusRefs, ringRefs, handleBallEnter, handleBallExit } =
    usePlungerSimulation({
      pressedKeys,
      rootPosition,
      tipRestPosition,
      ringRestPositions,
      movementAxis,
      ringMeshes,
    })

  return (
    <group position={position}>
      <RigidBody type="fixed" colliders={false} friction={PLUNGER_LANE_FRICTION}>
        <CuboidCollider
          sensor
          name="plunger-sensor"
          args={[PLUNGER_SPRING_RADIUS + 0.1, 0.3, 0.8]}
          position={[0, 0, -0.2]}
          onIntersectionEnter={handleBallEnter}
          onIntersectionExit={handleBallExit}
        />
      </RigidBody>

      <RigidBody ref={rodBodyRef} type="kinematicPosition" colliders={false}>
        <CuboidCollider args={[PLUNGER_ROD_RADIUS, PLUNGER_ROD_RADIUS, PLUNGER_ROD_LENGTH / 2]} />
      </RigidBody>

      <group ref={tipGroupRef} position={tipMesh?.position ?? [0, 0, 0]}>
        {tipMesh ? (
          <primitive object={tipMesh.mesh} />
        ) : (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry
              args={[PLUNGER_ROD_RADIUS, PLUNGER_ROD_RADIUS, PLUNGER_ROD_LENGTH, 16]}
            />
            <meshStandardMaterial color="#888" />
          </mesh>
        )}
      </group>

      {ringMeshes.length > 0
        ? ringMeshes.map((part, i) => (
            <group
              key={part.mesh.uuid}
              ref={(el) => {
                ringRefs.current[i] = el
              }}
              position={part.position}
            >
              <primitive object={part.mesh} />
            </group>
          ))
        : Array.from({ length: PLUNGER_SPRING_TORUS_COUNT }).map((_, i) => (
            <group
              key={i}
              ref={(el) => {
                torusRefs.current[i] = el
              }}
              position={[0, 0, PLUNGER_SPRING_SPACING * (i + 1)]}
            >
              <mesh>
                <torusGeometry args={[PLUNGER_SPRING_RADIUS, PLUNGER_SPRING_TUBE_RADIUS, 8, 24]} />
                <meshStandardMaterial color="#aaa" />
              </mesh>
            </group>
          ))}
    </group>
  )
}

export default Plunger
