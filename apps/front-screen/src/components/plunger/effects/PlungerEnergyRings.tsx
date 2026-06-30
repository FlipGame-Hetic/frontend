import { useFrame } from "@react-three/fiber"
import { useMemo, useRef, type RefObject } from "react"
import type { Group } from "three"
import { Quaternion, Vector3 } from "three"
import { createEnergyRingMaterial, updateEnergyRingMaterial } from "./energyRingMaterial"
import {
  PLUNGER_RING_BASIS_FALLBACK_AXIS,
  PLUNGER_RING_BASIS_HELPER_AXIS,
  PLUNGER_RING_BASIS_PARALLEL_DOT_THRESHOLD,
  PLUNGER_RING_BOB_AMPLITUDE,
  PLUNGER_RING_BOB_SPEED,
  PLUNGER_RING_CONVERGENCE,
  PLUNGER_RING_FLASH_DECAY,
  PLUNGER_RING_FLASH_PEAK,
  PLUNGER_RING_IDLE_PHASE_STEP,
  PLUNGER_RING_LOCAL_FORWARD_AXIS,
  PLUNGER_RING_MATERIAL_INTENSITY,
  PLUNGER_RING_NEST_FACTOR,
  PLUNGER_RING_PHASE_STAGGER,
  PLUNGER_RING_RADIAL_SEGMENTS,
  PLUNGER_RING_RADIUS,
  PLUNGER_RING_RECOIL_AMPLITUDE,
  PLUNGER_RING_RECOIL_DAMPING,
  PLUNGER_RING_RECOIL_DURATION,
  PLUNGER_RING_RECOIL_FREQUENCY,
  PLUNGER_RING_RECOIL_TAPER,
  PLUNGER_RING_SECONDARY_BOB_AMPLITUDE_SCALE,
  PLUNGER_RING_SECONDARY_BOB_PHASE_SCALE,
  PLUNGER_RING_SECONDARY_BOB_SPEED_SCALE,
  PLUNGER_RING_TUBE_RADIUS,
  PLUNGER_RING_TUBULAR_SEGMENTS,
  PLUNGER_RING_WOBBLE,
  PLUNGER_RING_WOBBLE_SPEED,
  PLUNGER_RING_Y_WOBBLE_SPEED_SCALE,
} from "./plungerVfxConfig"
import type { PlungerLaunchState } from "../simulation/usePlungerSimulation"

interface PlungerEnergyRingsProps {
  chargeRef: RefObject<number>
  launchRef: RefObject<PlungerLaunchState>
  restPositions: Vector3[]
  movementAxis: Vector3
  color: string
}

// Floating energy rings that rotate slightly when the plunger is at rest, pull together as it charges, then recoil on launch
const PlungerEnergyRings = ({
  chargeRef,
  launchRef,
  restPositions,
  movementAxis,
  color,
}: PlungerEnergyRingsProps) => {
  // One slot per ring group, filled by the ref callbacks in the render below
  const groupRefs = useRef<(Group | null)[]>([])
  // Last launch token we reacted to, lets us fire the recoil exactly once per launch
  const lastTokenRef = useRef(0)
  // Time since the last launch, starts at infinity so no recoil plays before the first launch
  const recoilTimerRef = useRef(Number.POSITIVE_INFINITY)
  // Bright flash amount that decays back to 0 after each launch
  const flashRef = useRef(0)

  // One animated shader material per ring, the i * PLUNGER_RING_PHASE_STAGGER staggers their phase so they shimmer out of sync
  const materials = useMemo(
    () =>
      restPositions.map((_, i) =>
        createEnergyRingMaterial(
          i * PLUNGER_RING_PHASE_STAGGER,
          PLUNGER_RING_MATERIAL_INTENSITY,
          color,
        ),
      ),
    [restPositions, color],
  )

  // Rotation that turns a ring facing +Z into one facing along the travel axis, so the rings sit across the lane
  const orientation = useMemo(
    () =>
      new Quaternion().setFromUnitVectors(
        new Vector3(...PLUNGER_RING_LOCAL_FORWARD_AXIS),
        movementAxis,
      ),
    [movementAxis],
  )

  // Two axes perpendicular to the travel axis, used to push the rings sideways for the idle bob and wobble
  const basis = useMemo(() => {
    const helper = new Vector3(...PLUNGER_RING_BASIS_HELPER_AXIS)
    // If the travel axis is nearly parallel to x, pick y instead so the cross product stays well defined
    if (Math.abs(movementAxis.dot(helper)) > PLUNGER_RING_BASIS_PARALLEL_DOT_THRESHOLD) {
      helper.set(...PLUNGER_RING_BASIS_FALLBACK_AXIS)
    }
    const perpA = new Vector3().crossVectors(movementAxis, helper).normalize()
    const perpB = new Vector3().crossVectors(movementAxis, perpA).normalize()
    return { perpA, perpB }
  }, [movementAxis])

  // How far the back ring sits behind the front ring along the travel axis, spanning the rings spread over
  const restLength = useMemo(() => {
    const back = restPositions.at(-1)
    const front = restPositions[0]
    if (!back || !front) return 0
    return Math.max(back.clone().sub(front).dot(movementAxis), 0)
  }, [restPositions, movementAxis])

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime
    const charge = chargeRef.current
    const launch = launchRef.current

    // A new launch token just arrived, reset the recoil timer and kick the flash to full
    if (launch.token !== lastTokenRef.current) {
      lastTokenRef.current = launch.token
      recoilTimerRef.current = 0
      flashRef.current = PLUNGER_RING_FLASH_PEAK
    }

    recoilTimerRef.current += delta
    // Exponential decay, the flash fades a bit more every frame
    flashRef.current *= Math.exp(-PLUNGER_RING_FLASH_DECAY * delta)

    // Damped sine recoil, a spring-like wobble along the axis that dies out after PLUNGER_RING_RECOIL_DURATION
    const recoil =
      recoilTimerRef.current < PLUNGER_RING_RECOIL_DURATION
        ? Math.sin(recoilTimerRef.current * PLUNGER_RING_RECOIL_FREQUENCY) *
          Math.exp(-recoilTimerRef.current * PLUNGER_RING_RECOIL_DAMPING) *
          PLUNGER_RING_RECOIL_AMPLITUDE
        : 0

    const back = restPositions.at(-1)
    if (!back) return

    // The more charge, the more the rings pull together toward the back ring
    const compressedLength = restLength * (1 - charge * PLUNGER_RING_CONVERGENCE)
    const count = restPositions.length
    // Idle motion fades out as charge rises, so a charged plunger looks tense and still
    const idleFactor = 1 - charge
    const bobAmp = PLUNGER_RING_BOB_AMPLITUDE * idleFactor
    const wobble = PLUNGER_RING_WOBBLE * idleFactor

    for (let i = 0; i < count; i++) {
      const group = groupRefs.current[i]
      const material = materials[i]
      if (!group || !material) continue

      // t goes from 0 at the back ring to 1 at the front ring
      const t = count <= 1 ? 0 : i / (count - 1)
      // Per-ring phase offset so they do not all bob and wobble together
      const phase = i * PLUNGER_RING_IDLE_PHASE_STEP

      group.position
        .copy(back)
        // Spread the rings forward from the back along the axis, less spread the more charged
        .addScaledVector(movementAxis, -compressedLength * (1 - t))
        // Apply the launch recoil, stronger on the back rings
        .addScaledVector(movementAxis, recoil * (1 - t * PLUNGER_RING_RECOIL_TAPER))
        // Idle bob sideways on the two perpendicular axes
        .addScaledVector(basis.perpA, Math.sin(time * PLUNGER_RING_BOB_SPEED + phase) * bobAmp)
        .addScaledVector(
          basis.perpB,
          Math.cos(
            time * PLUNGER_RING_BOB_SPEED * PLUNGER_RING_SECONDARY_BOB_SPEED_SCALE +
              phase * PLUNGER_RING_SECONDARY_BOB_PHASE_SCALE,
          ) *
            bobAmp *
            PLUNGER_RING_SECONDARY_BOB_AMPLITUDE_SCALE,
        )

      // Face along the lane, then add a small idle tilt that also fades with charge
      group.quaternion.copy(orientation)
      group.rotateX(Math.sin(time * PLUNGER_RING_WOBBLE_SPEED + phase) * wobble)
      group.rotateY(
        Math.cos(time * PLUNGER_RING_WOBBLE_SPEED * PLUNGER_RING_Y_WOBBLE_SPEED_SCALE + phase) *
          wobble,
      )

      // Nest the rings into each other as charge rises, front rings shrink a bit more
      group.scale.setScalar(1 - i * PLUNGER_RING_NEST_FACTOR * charge)

      updateEnergyRingMaterial(material, time, charge, flashRef.current)
    }
  })

  return (
    <>
      {restPositions.map((restPosition, i) => (
        <group
          key={i}
          ref={(el) => {
            groupRefs.current[i] = el
          }}
          position={restPosition}
          quaternion={orientation}
        >
          <mesh material={materials[i]}>
            <torusGeometry
              args={[
                PLUNGER_RING_RADIUS,
                PLUNGER_RING_TUBE_RADIUS,
                PLUNGER_RING_RADIAL_SEGMENTS,
                PLUNGER_RING_TUBULAR_SEGMENTS,
              ]}
            />
          </mesh>
        </group>
      ))}
    </>
  )
}

export default PlungerEnergyRings
