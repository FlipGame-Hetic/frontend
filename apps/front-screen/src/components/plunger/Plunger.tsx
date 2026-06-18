import useKeyboard from "@/hooks/useKeyboard"
import { getCharacterMaterialColor } from "@/config/characterColors"
import useGameStore from "@/stores/useGameStore"
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
} from "./plungerConfig"
import PlungerBeam from "./PlungerBeam"
import PlungerEnergyRings from "./PlungerEnergyRings"
import PlungerNeonTip from "./PlungerNeonTip"
import PlungerShockwave from "./PlungerShockwave"
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
  const character = useGameStore(
    (s) => s.selectedPlayers.find((p) => p.player === s.currentPlayer)?.character,
  )
  const vfxColor = getCharacterMaterialColor(character)

  const rootPosition = useMemo(() => toVector3(position), [position])
  const tipRestPosition = useMemo(
    () => toVector3(tipMesh?.position ?? [0, 0, 0]),
    [tipMesh?.position],
  )
  const ringRestPositions = useMemo(() => {
    if (ringMeshes.length > 0) return ringMeshes.map((part) => toVector3(part.position))
    return Array.from(
      { length: PLUNGER_SPRING_TORUS_COUNT },
      (_, i) => new Vector3(0, 0, PLUNGER_SPRING_SPACING * (i + 1)),
    )
  }, [ringMeshes])
  const movementAxis = useMemo(() => {
    const backRing = ringRestPositions.at(-1)
    if (!backRing) return new Vector3(0, 0, 1)
    const axis = backRing.clone().sub(tipRestPosition)
    if (axis.lengthSq() === 0) return new Vector3(0, 0, 1)
    return axis.normalize()
  }, [ringRestPositions, tipRestPosition])

  const { tipGroupRef, rodBodyRef, chargeRef, launchRef, handleBallEnter, handleBallExit } =
    usePlungerSimulation({
      pressedKeys,
      rootPosition,
      tipRestPosition,
      movementAxis,
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
        <PlungerNeonTip mesh={tipMesh?.mesh} chargeRef={chargeRef} color={vfxColor} />
      </group>

      <PlungerEnergyRings
        chargeRef={chargeRef}
        launchRef={launchRef}
        restPositions={ringRestPositions}
        movementAxis={movementAxis}
        color={vfxColor}
      />
      <PlungerBeam launchRef={launchRef} movementAxis={movementAxis} color={vfxColor} />
      <PlungerShockwave launchRef={launchRef} movementAxis={movementAxis} color={vfxColor} />
    </group>
  )
}

export default Plunger
