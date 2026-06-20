import { useCurrentBallColor } from "@/config/characterColors"
import { useFrame } from "@react-three/fiber"
import { useCallback, useMemo } from "react"
import { BufferAttribute, BufferGeometry, DynamicDrawUsage } from "three"
import { consumeParticleBursts, type QueuedParticleBurst } from "./particleBurstQueue"
import { ParticleBurstPool } from "./particleBurstPool"
import { createParticlePointMaterial } from "./particlePointMaterial"

const ParticleBurstManager = () => {
  const ballColor = useCurrentBallColor()
  const pool = useMemo(() => new ParticleBurstPool(), [])
  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
    const position = new BufferAttribute(pool.positions, 3)
    const color = new BufferAttribute(pool.colors, 4)
    const size = new BufferAttribute(pool.sizes, 1)
    position.usage = DynamicDrawUsage
    color.usage = DynamicDrawUsage
    size.usage = DynamicDrawUsage
    geo.setAttribute("position", position)
    geo.setAttribute("aColor", color)
    geo.setAttribute("aSize", size)
    return geo
  }, [pool])
  const material = useMemo(() => createParticlePointMaterial(), [])

  const handleBurst = useCallback(
    (burst: QueuedParticleBurst) => {
      pool.emitBurst(burst, ballColor, performance.now() / 1000)
    },
    [ballColor, pool],
  )

  useFrame((_, delta) => {
    const consumed = consumeParticleBursts(handleBurst)
    const changed = pool.update(delta)
    if (!consumed && !changed) return

    const position = geometry.getAttribute("position") as BufferAttribute
    const color = geometry.getAttribute("aColor") as BufferAttribute
    const size = geometry.getAttribute("aSize") as BufferAttribute
    position.needsUpdate = true
    color.needsUpdate = true
    size.needsUpdate = true
  })

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={2} />
}

export default ParticleBurstManager
