import { useCurrentBallColor } from "@/config/characterConfig"
import useKeyboard from "@/hooks/useKeyboard"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { useMemo } from "react"
import { Vector3 } from "three"
import { toVector3 } from "../physics/physicsConfig"
import PlungerBeam from "./effects/PlungerBeam"
import PlungerEnergyRings from "./effects/PlungerEnergyRings"
import PlungerNeonTip from "./effects/PlungerNeonTip"
import PlungerParticles from "./effects/PlungerParticles"
import PlungerShockwave from "./effects/PlungerShockwave"
import {
  PLUNGER_FALLBACK_SPRINGS_COUNT,
  PLUNGER_FALLBACK_SPRINGS_RADIUS,
  PLUNGER_FALLBACK_SPRINGS_SPACING,
  PLUNGER_LANE_FRICTION,
  PLUNGER_POSITION,
  PLUNGER_ROD_LENGTH,
  PLUNGER_ROD_RADIUS,
} from "./plungerConfig"
import { type PlungerMeshPart, usePlungerSimulation } from "./simulation/usePlungerSimulation"

interface PlungerProps {
  position?: [number, number, number]
  tipMesh?: PlungerMeshPart
  ringMeshes?: PlungerMeshPart[]
}

const Plunger = ({ position = PLUNGER_POSITION, tipMesh, ringMeshes = [] }: PlungerProps) => {
  const pressedKeys = useKeyboard()
  // Uses the current character's color for the visual effects
  const vfxColor = useCurrentBallColor()

  // Uses the default plunger position, converts it in Vector3 and memoizes it once
  const rootPosition = useMemo(() => toVector3(position), [position])

  // Position of the tip when resting (idle)
  const tipRestPosition = useMemo(
    () => toVector3(tipMesh?.position ?? [0, 0, 0]),
    [tipMesh?.position],
  )
  // Position of the rings when resting (idle)
  const ringRestPositions = useMemo(() => {
    if (ringMeshes.length > 0) return ringMeshes.map((part) => toVector3(part.position))
    // If no rings came from the model, lay out evenly spaced fallback rings along the travel axis
    return Array.from(
      { length: PLUNGER_FALLBACK_SPRINGS_COUNT },
      (_, i) => new Vector3(0, 0, PLUNGER_FALLBACK_SPRINGS_SPACING * (i + 1)),
    )
  }, [ringMeshes])

  // Plunger travel direction, from the back spring ring to the tip, with a +Z fallback
  const movementAxis = useMemo(() => {
    const backRing = ringRestPositions.at(-1)
    if (!backRing) return new Vector3(0, 0, 1)

    // Use the distance between the backRing (closest to the player) and the tip as plunger's axis
    const axis = backRing.clone().sub(tipRestPosition)
    // If tip and back ring are at the same exact position, the direction is undefined so we fall back to +Z
    if (axis.lengthSq() === 0) return new Vector3(0, 0, 1)

    // We normalize the Vector to make its length equivalent to 1, so only the direction is read without taking the distance or potential impulse into account
    return axis.normalize()
  }, [ringRestPositions, tipRestPosition])

  // The hook is responsible of the useFrame loop, it returns refs that the component reads and callbacks that the sensor trigger
  const { tipGroupRef, rodBodyRef, chargeRef, launchRef, handleBallEnter, handleBallExit } =
    usePlungerSimulation({
      pressedKeys,
      rootPosition,
      tipRestPosition,
      movementAxis,
    })

  return (
    <group position={position}>
      {/* Sensor at the start of the lane to report when the ball enters or leaves the plunger's area */}
      <RigidBody type="fixed" colliders={false} friction={PLUNGER_LANE_FRICTION}>
        <CuboidCollider
          sensor
          name="plunger-sensor"
          // Uses the springs radius with a bit of padding to fill the lane without overflowing
          args={[PLUNGER_FALLBACK_SPRINGS_RADIUS + 0.1, 0.3, 0.8]}
          position={[0, 0, -0.2]}
          onIntersectionEnter={handleBallEnter}
          onIntersectionExit={handleBallExit}
        />
      </RigidBody>

      {/* The rod is the body that actually hits the ball, it is kinematic so the hook "manually" moves it instead of letting the physics handle it */}
      <RigidBody ref={rodBodyRef} type="kinematicPosition" colliders={false}>
        <CuboidCollider args={[PLUNGER_ROD_RADIUS, PLUNGER_ROD_RADIUS, PLUNGER_ROD_LENGTH / 2]} />
      </RigidBody>

      {/* Visual tip, the hook slides this group back and forth to show the charge, it carries no collider of its own */}
      <group ref={tipGroupRef} position={tipMesh?.position ?? [0, 0, 0]}>
        <PlungerNeonTip mesh={tipMesh?.mesh} chargeRef={chargeRef} color={vfxColor} />
      </group>

      {/* VFX read chargeRef and launchRef every frame so they react without forcing React re-renders */}
      <PlungerEnergyRings
        chargeRef={chargeRef}
        launchRef={launchRef}
        restPositions={ringRestPositions}
        movementAxis={movementAxis}
        color={vfxColor}
      />
      <PlungerBeam launchRef={launchRef} movementAxis={movementAxis} color={vfxColor} />
      <PlungerShockwave launchRef={launchRef} movementAxis={movementAxis} color={vfxColor} />
      <PlungerParticles
        chargeRef={chargeRef}
        launchRef={launchRef}
        restPositions={ringRestPositions}
        movementAxis={movementAxis}
        color={vfxColor}
      />
    </group>
  )
}

export default Plunger
