import { useFrame } from "@react-three/fiber"
import { useMemo, type RefObject } from "react"
import { BufferAttribute, BufferGeometry, DynamicDrawUsage, Vector3 } from "three"
import { createParticlePointMaterial } from "../../vfx/particles/particlePointMaterial"
import { PlungerParticlePool, type PlungerParticleFrame } from "./plungerParticlePool"
import type { PlungerLaunchState } from "../simulation/usePlungerSimulation"
import { toVector3 } from "@/components/physics/physicsConfig"

interface PlungerParticlesProps {
  chargeRef: RefObject<number>
  launchRef: RefObject<PlungerLaunchState>
  restPositions: Vector3[]
  movementAxis: Vector3
  color: string
}

// Build the fixed frame the particle pool spawns into, the lane origin plus a perpendicular basis to scatter particles around the axis
const getParticleFrame = (
  restPositions: Vector3[],
  movementAxis: Vector3,
): PlungerParticleFrame => {
  const front = restPositions[0] ?? new Vector3()
  const back = restPositions.at(-1) ?? front
  // Start from world x and remove its component along the axis, what is left is perpendicular to the axis (Gram-Schmidt)
  const basisA = new Vector3(1, 0, 0).addScaledVector(
    movementAxis,
    -movementAxis.dot(new Vector3(1, 0, 0)),
  )
  // World x was nearly parallel to the axis so almost nothing was left, redo it from world z instead
  if (basisA.lengthSq() < 0.01) {
    basisA.set(0, 0, 1).addScaledVector(movementAxis, -movementAxis.z)
  }
  basisA.normalize()
  // basisB is perpendicular to both, the three together form the spawn frame
  const basisB = new Vector3().crossVectors(movementAxis, basisA).normalize()
  // Length of the lane the particles spread over, floored at 0.2 so it is never zero
  const span = Math.max(back.clone().sub(front).dot(movementAxis), 0.2)

  return {
    front: toVector3(front),
    axis: toVector3(movementAxis),
    basisA: toVector3(basisA),
    basisB: toVector3(basisB),
    span,
  }
}

// Charge sparks and launch burst, all driven by a GPU point cloud the pool writes into directly
const PlungerParticles = ({
  chargeRef,
  launchRef,
  restPositions,
  movementAxis,
  color,
}: PlungerParticlesProps) => {
  const frame = useMemo(
    () => getParticleFrame(restPositions, movementAxis),
    [movementAxis, restPositions],
  )
  // The pool owns the particle simulation and the raw typed arrays the geometry reads from
  const pool = useMemo(() => new PlungerParticlePool(frame), [frame])
  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
    const position = new BufferAttribute(pool.positions, 3)
    const particleColor = new BufferAttribute(pool.colors, 4)
    const size = new BufferAttribute(pool.sizes, 1)
    // Tell three these buffers change every frame so it does not treat them as static
    position.usage = DynamicDrawUsage
    particleColor.usage = DynamicDrawUsage
    size.usage = DynamicDrawUsage
    geo.setAttribute("position", position)
    geo.setAttribute("aColor", particleColor)
    geo.setAttribute("aSize", size)
    return geo
  }, [pool])
  const material = useMemo(() => createParticlePointMaterial(), [])

  useFrame((state, delta) => {
    const launch = launchRef.current
    // The pool advances the sim and reports whether any buffer actually changed this frame
    const changed = pool.update(
      delta,
      state.clock.elapsedTime,
      chargeRef.current,
      launch.token,
      launch.charge,
      color,
    )
    // Nothing moved, skip the GPU re-upload
    if (!changed) return

    // Flag the buffers so three re-uploads them to the GPU for this frame
    const position = geometry.getAttribute("position") as BufferAttribute
    const particleColor = geometry.getAttribute("aColor") as BufferAttribute
    const size = geometry.getAttribute("aSize") as BufferAttribute
    position.needsUpdate = true
    particleColor.needsUpdate = true
    size.needsUpdate = true
  })

  // frustumCulled off so the cloud never blinks out when its bounding box leaves the screen, renderOrder 3 keeps it drawing over the rest
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={3} />
}

export default PlungerParticles
