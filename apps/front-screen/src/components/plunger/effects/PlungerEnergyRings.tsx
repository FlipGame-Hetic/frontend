import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import type { Group } from "three"
import { Quaternion, Vector3 } from "three"
import { createEnergyRingMaterial, updateEnergyRingMaterial } from "./energyRingMaterial"
import {
  PLUNGER_RING_BOB_AMPLITUDE,
  PLUNGER_RING_BOB_SPEED,
  PLUNGER_RING_CONVERGENCE,
  PLUNGER_RING_FLASH_DECAY,
  PLUNGER_RING_NEST_FACTOR,
  PLUNGER_RING_RADIUS,
  PLUNGER_RING_RECOIL_AMPLITUDE,
  PLUNGER_RING_RECOIL_DAMPING,
  PLUNGER_RING_RECOIL_DURATION,
  PLUNGER_RING_RECOIL_FREQUENCY,
  PLUNGER_RING_TUBE_RADIUS,
  PLUNGER_RING_WOBBLE,
  PLUNGER_RING_WOBBLE_SPEED,
} from "./plungerVfxConfig"
import type { PlungerLaunchState } from "../simulation/usePlungerSimulation"

interface PlungerEnergyRingsProps {
  chargeRef: React.RefObject<number>
  launchRef: React.RefObject<PlungerLaunchState>
  restPositions: Vector3[]
  movementAxis: Vector3
  color: string
}

const PlungerEnergyRings = ({
  chargeRef,
  launchRef,
  restPositions,
  movementAxis,
  color,
}: PlungerEnergyRingsProps) => {
  const groupRefs = useRef<(Group | null)[]>([])
  const lastTokenRef = useRef(0)
  const recoilTimerRef = useRef(Number.POSITIVE_INFINITY)
  const flashRef = useRef(0)

  const materials = useMemo(
    () => restPositions.map((_, i) => createEnergyRingMaterial(i * 0.37, 1, color)),
    [restPositions, color],
  )

  const orientation = useMemo(
    () => new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), movementAxis),
    [movementAxis],
  )

  const basis = useMemo(() => {
    const helper = new Vector3(1, 0, 0)
    if (Math.abs(movementAxis.dot(helper)) > 0.9) helper.set(0, 1, 0)
    const perpA = new Vector3().crossVectors(movementAxis, helper).normalize()
    const perpB = new Vector3().crossVectors(movementAxis, perpA).normalize()
    return { perpA, perpB }
  }, [movementAxis])

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

    if (launch.token !== lastTokenRef.current) {
      lastTokenRef.current = launch.token
      recoilTimerRef.current = 0
      flashRef.current = 1
    }

    recoilTimerRef.current += delta
    flashRef.current *= Math.exp(-PLUNGER_RING_FLASH_DECAY * delta)

    const recoil =
      recoilTimerRef.current < PLUNGER_RING_RECOIL_DURATION
        ? Math.sin(recoilTimerRef.current * PLUNGER_RING_RECOIL_FREQUENCY) *
          Math.exp(-recoilTimerRef.current * PLUNGER_RING_RECOIL_DAMPING) *
          PLUNGER_RING_RECOIL_AMPLITUDE
        : 0

    const back = restPositions.at(-1)
    if (!back) return

    const compressedLength = restLength * (1 - charge * PLUNGER_RING_CONVERGENCE)
    const count = restPositions.length
    const idleFactor = 1 - charge
    const bobAmp = PLUNGER_RING_BOB_AMPLITUDE * idleFactor
    const wobble = PLUNGER_RING_WOBBLE * idleFactor

    for (let i = 0; i < count; i++) {
      const group = groupRefs.current[i]
      const material = materials[i]
      if (!group || !material) continue

      const t = count <= 1 ? 0 : i / (count - 1)
      const phase = i * 1.7

      group.position
        .copy(back)
        .addScaledVector(movementAxis, -compressedLength * (1 - t))
        .addScaledVector(movementAxis, recoil * (1 - t * 0.5))
        .addScaledVector(basis.perpA, Math.sin(time * PLUNGER_RING_BOB_SPEED + phase) * bobAmp)
        .addScaledVector(
          basis.perpB,
          Math.cos(time * PLUNGER_RING_BOB_SPEED * 0.8 + phase * 1.7) * bobAmp * 0.6,
        )

      group.quaternion.copy(orientation)
      group.rotateX(Math.sin(time * PLUNGER_RING_WOBBLE_SPEED + phase) * wobble)
      group.rotateY(Math.cos(time * PLUNGER_RING_WOBBLE_SPEED * 1.3 + phase) * wobble)

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
            <torusGeometry args={[PLUNGER_RING_RADIUS, PLUNGER_RING_TUBE_RADIUS, 12, 48]} />
          </mesh>
        </group>
      ))}
    </>
  )
}

export default PlungerEnergyRings
