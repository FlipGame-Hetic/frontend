import type { RapierRigidBody } from "@react-three/rapier"
import { useFrame } from "@react-three/fiber"
import type { RefObject } from "react"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import {
  TRAIL_FADE_DURATION,
  TRAIL_HALF_HEIGHT,
  TRAIL_HALF_WIDTH,
  TRAIL_HDR_FACTOR,
  TRAIL_IDLE_ALPHA,
  TRAIL_IDLE_LERP_SPEED,
  TRAIL_IDLE_THRESHOLD_SQ,
  TRAIL_POINTS,
  TRAIL_TAIL_FADE_POINTS,
  TRAIL_TELEPORT_THRESHOLD_SQ,
} from "./ballTrailConfig"

const PF_NL = Math.hypot(0, 1, 0.21)
const PF_NY = 1 / PF_NL
const PF_NZ = 0.21 / PF_NL

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAGMENT_SHADER = `
  uniform vec3 trailColor;
  uniform float fadeAlpha;
  varying vec2 vUv;
  void main() {
    float lateral = sin(vUv.x * 3.14159265);
    float v = vUv.y;
    gl_FragColor = vec4(trailColor * v, lateral * v * fadeAlpha);
  }
`

interface BallTrailProps {
  ballRef: RefObject<RapierRigidBody | null>
  fadingRef: { current: boolean }
  onFadeComplete: () => void
  color: string
  pointCount?: number
}

const BallTrail = ({
  ballRef,
  fadingRef,
  onFadeComplete,
  color,
  pointCount = TRAIL_POINTS,
}: BallTrailProps) => {
  const centerPos = useRef(new Float32Array(TRAIL_POINTS * 3))
  const ribPos = useRef(new Float32Array(TRAIL_POINTS * 4 * 3))
  const ribUv = useRef(new Float32Array(TRAIL_POINTS * 4 * 2))

  const prevPos = useRef<{ x: number; y: number; z: number } | null>(null)
  const initialized = useRef(false)
  const fadeProgress = useRef(0)
  const fadeCompleted = useRef(false)
  const isIdleRef = useRef(false)
  const activePointCountRef = useRef(pointCount)
  const previousPointCountRef = useRef(pointCount)
  const onFadeCompleteRef = useRef(onFadeComplete)
  onFadeCompleteRef.current = onFadeComplete
  const positionAttrRef = useRef<THREE.BufferAttribute | null>(null)
  const uvAttrRef = useRef<THREE.BufferAttribute | null>(null)
  const disposeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const uniforms = useMemo(
    () => ({
      trailColor: { value: new THREE.Color(color).multiplyScalar(TRAIL_HDR_FACTOR) },
      fadeAlpha: { value: 1 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const geo = useMemo(() => new THREE.BufferGeometry(), [])

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms],
  )

  useEffect(() => {
    uniforms.trailColor.value.set(color).multiplyScalar(TRAIL_HDR_FACTOR)
  }, [color, uniforms])

  useEffect(() => {
    activePointCountRef.current = THREE.MathUtils.clamp(Math.floor(pointCount), 2, TRAIL_POINTS)
  }, [pointCount])

  useEffect(() => {
    const indices = new Uint16Array((TRAIL_POINTS - 1) * 12)
    for (let i = 0; i < TRAIL_POINTS - 1; i++) {
      const b = i * 12
      const v = i * 4
      const n = v + 4
      // height ribbon
      indices[b] = v
      indices[b + 1] = v + 1
      indices[b + 2] = n
      indices[b + 3] = v + 1
      indices[b + 4] = n + 1
      indices[b + 5] = n
      // width ribbon
      indices[b + 6] = v + 2
      indices[b + 7] = v + 3
      indices[b + 8] = n + 2
      indices[b + 9] = v + 3
      indices[b + 10] = n + 3
      indices[b + 11] = n + 2
    }

    for (let i = 0; i < TRAIL_POINTS; i++) {
      const base = i * 8
      ribUv.current[base] = 0
      ribUv.current[base + 2] = 1
      ribUv.current[base + 4] = 0
      ribUv.current[base + 6] = 1
    }

    const posAttr = new THREE.BufferAttribute(ribPos.current, 3)
    posAttr.usage = THREE.DynamicDrawUsage
    const uvAttr = new THREE.BufferAttribute(ribUv.current, 2)
    uvAttr.usage = THREE.DynamicDrawUsage

    geo.setIndex(new THREE.BufferAttribute(indices, 1))
    geo.setAttribute("position", posAttr)
    geo.setAttribute("uv", uvAttr)
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 30)
    positionAttrRef.current = posAttr
    uvAttrRef.current = uvAttr
  }, [geo])

  useEffect(() => {
    if (disposeTimeoutRef.current !== null) {
      clearTimeout(disposeTimeoutRef.current)
      disposeTimeoutRef.current = null
    }

    return () => {
      disposeTimeoutRef.current = setTimeout(() => {
        mat.dispose()
        geo.dispose()
        positionAttrRef.current = null
        uvAttrRef.current = null
        disposeTimeoutRef.current = null
      }, 0)
    }
  }, [geo, mat])

  useFrame((_, delta) => {
    const activePointCount = activePointCountRef.current

    if (fadingRef.current) {
      if (!fadeCompleted.current) {
        fadeProgress.current += delta / TRAIL_FADE_DURATION
        uniforms.fadeAlpha.value = Math.max(0, 1 - fadeProgress.current)
        if (fadeProgress.current >= 1) {
          fadeCompleted.current = true
          onFadeCompleteRef.current()
        }
      }
      return
    }

    const body = ballRef.current
    if (!body) return

    const pos = body.translation()

    if (!initialized.current || previousPointCountRef.current !== activePointCount) {
      for (let i = 0; i < activePointCount; i++) {
        centerPos.current[i * 3] = pos.x
        centerPos.current[i * 3 + 1] = pos.y
        centerPos.current[i * 3 + 2] = pos.z
      }
      initialized.current = true
      previousPointCountRef.current = activePointCount
      geo.setDrawRange(0, (activePointCount - 1) * 12)
    }

    if (prevPos.current) {
      const p = prevPos.current
      const dsq = (pos.x - p.x) ** 2 + (pos.y - p.y) ** 2 + (pos.z - p.z) ** 2
      if (dsq > TRAIL_TELEPORT_THRESHOLD_SQ) {
        for (let i = 0; i < activePointCount; i++) {
          centerPos.current[i * 3] = pos.x
          centerPos.current[i * 3 + 1] = pos.y
          centerPos.current[i * 3 + 2] = pos.z
        }
      }
      isIdleRef.current = dsq < TRAIL_IDLE_THRESHOLD_SQ
    }
    prevPos.current = { x: pos.x, y: pos.y, z: pos.z }

    const targetAlpha = isIdleRef.current ? TRAIL_IDLE_ALPHA : 1.0
    uniforms.fadeAlpha.value +=
      (targetAlpha - uniforms.fadeAlpha.value) * Math.min(1, TRAIL_IDLE_LERP_SPEED * delta)

    centerPos.current.copyWithin(0, 3, activePointCount * 3)

    const last = (activePointCount - 1) * 3
    centerPos.current[last] = pos.x
    centerPos.current[last + 1] = pos.y
    centerPos.current[last + 2] = pos.z

    const rp = ribPos.current
    const ru = ribUv.current

    for (let i = 0; i < activePointCount; i++) {
      const ci = i * 3
      const cx = centerPos.current[ci] ?? 0
      const cy = centerPos.current[ci + 1] ?? 0
      const cz = centerPos.current[ci + 2] ?? 0

      const linearFade = i / (activePointCount - 1)
      const tailSoftener = i < TRAIL_TAIL_FADE_POINTS ? (i / TRAIL_TAIL_FADE_POINTS) ** 2 : 1
      const v = linearFade * tailSoftener

      const pi = i * 12
      rp[pi] = cx
      rp[pi + 1] = cy - PF_NY * TRAIL_HALF_HEIGHT
      rp[pi + 2] = cz - PF_NZ * TRAIL_HALF_HEIGHT
      rp[pi + 3] = cx
      rp[pi + 4] = cy + PF_NY * TRAIL_HALF_HEIGHT
      rp[pi + 5] = cz + PF_NZ * TRAIL_HALF_HEIGHT
      rp[pi + 6] = cx - TRAIL_HALF_WIDTH
      rp[pi + 7] = cy
      rp[pi + 8] = cz
      rp[pi + 9] = cx + TRAIL_HALF_WIDTH
      rp[pi + 10] = cy
      rp[pi + 11] = cz

      const ui = i * 8
      ru[ui + 1] = v
      ru[ui + 3] = v
      ru[ui + 5] = v
      ru[ui + 7] = v
    }

    const positionAttr = positionAttrRef.current
    const uvAttr = uvAttrRef.current
    if (positionAttr && uvAttr) {
      positionAttr.needsUpdate = true
      uvAttr.needsUpdate = true
    }
  })

  return <mesh renderOrder={1} geometry={geo} material={mat} dispose={null} />
}

export default BallTrail
