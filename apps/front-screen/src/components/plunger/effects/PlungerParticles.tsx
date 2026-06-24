import { useFrame } from "@react-three/fiber"
import { useMemo } from "react"
import { BufferAttribute, BufferGeometry, DynamicDrawUsage, Vector3 } from "three"
import { createParticlePointMaterial } from "../../vfx/particles/particlePointMaterial"
import { PlungerParticlePool, type PlungerParticleFrame } from "./plungerParticlePool"
import type { PlungerLaunchState } from "../simulation/usePlungerSimulation"

interface PlungerParticlesProps {
  chargeRef: React.RefObject<number>
  launchRef: React.RefObject<PlungerLaunchState>
  restPositions: Vector3[]
  movementAxis: Vector3
  color: string
}

const toParticleVector = (v: Vector3) => ({ x: v.x, y: v.y, z: v.z })

const getParticleFrame = (
  restPositions: Vector3[],
  movementAxis: Vector3,
): PlungerParticleFrame => {
  const front = restPositions[0] ?? new Vector3()
  const back = restPositions.at(-1) ?? front
  // Projects a helper axis off movementAxis to ensure the particle frame has a perpendicular basis
  const basisA = new Vector3(1, 0, 0).addScaledVector(
    movementAxis,
    -movementAxis.dot(new Vector3(1, 0, 0)),
  )
  if (basisA.lengthSq() < 0.01) {
    basisA.set(0, 0, 1).addScaledVector(movementAxis, -movementAxis.z)
  }
  basisA.normalize()
  const basisB = new Vector3().crossVectors(movementAxis, basisA).normalize()
  const span = Math.max(back.clone().sub(front).dot(movementAxis), 0.2)

  return {
    front: toParticleVector(front),
    axis: toParticleVector(movementAxis),
    basisA: toParticleVector(basisA),
    basisB: toParticleVector(basisB),
    span,
  }
}

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
  const pool = useMemo(() => new PlungerParticlePool(frame), [frame])
  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
    const position = new BufferAttribute(pool.positions, 3)
    const particleColor = new BufferAttribute(pool.colors, 4)
    const size = new BufferAttribute(pool.sizes, 1)
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
    const changed = pool.update(
      delta,
      state.clock.elapsedTime,
      chargeRef.current,
      launch.token,
      launch.charge,
      color,
    )
    if (!changed) return

    const position = geometry.getAttribute("position") as BufferAttribute
    const particleColor = geometry.getAttribute("aColor") as BufferAttribute
    const size = geometry.getAttribute("aSize") as BufferAttribute
    position.needsUpdate = true
    particleColor.needsUpdate = true
    size.needsUpdate = true
  })

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={3} />
}

export default PlungerParticles
