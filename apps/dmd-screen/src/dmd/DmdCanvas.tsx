import { useCallback, useEffect, useRef } from "react"
import type { DmdConfig } from "./config"
import type { Scene } from "./types"
import { clearBuffer, clearColor, createSurface } from "./buffer"
import { drawActiveDotsToCanvas, drawDotGridToCanvas } from "./renderer"
import { useAnimationFrame } from "./useAnimationFrame"
import { fadeBuffer } from "./transitionFx"
import { easeInOutQuad } from "./ease"

const DMD_TARGET_FPS = 30
const TRANSITION_MS = 320

interface DmdCanvasProps {
  config: DmdConfig
  scene: Scene
  /** Changing this (e.g. the game phase) plays a fade transition to the new scene. */
  transitionKey?: string
}

export function DmdCanvas({ config, scene, transitionKey }: DmdCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 })
  const surfaceRef = useRef(createSurface(config.cols, config.rows))
  const sceneRef = useRef(scene)
  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const gridCacheKeyRef = useRef("")

  // Scene-to-scene transition state
  const keyRef = useRef(transitionKey)
  const transitionMsRef = useRef(TRANSITION_MS) // start settled (no transition on mount)
  const fromBufferRef = useRef<Float32Array | null>(null)
  const fromColorRef = useRef<Uint32Array | null>(null)

  // Keep scene ref in sync (also covers combo-overlay swaps within a phase)
  useEffect(() => {
    sceneRef.current = scene
  })

  // Start a fade only when the phase key changes (not on combo-overlay swaps).
  useEffect(() => {
    if (transitionKey === keyRef.current) return
    keyRef.current = transitionKey
    // Snapshot the last rendered frame so we can fade it out.
    const surface = surfaceRef.current
    fromBufferRef.current = surface.buffer.slice()
    fromColorRef.current = surface.color.slice()
    transitionMsRef.current = 0
  }, [transitionKey])

  // Recreate surface when grid size changes
  useEffect(() => {
    surfaceRef.current = createSurface(config.cols, config.rows)
  }, [config.cols, config.rows])

  // Handle canvas sizing with ResizeObserver + HiDPI
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return

      const dpr = window.devicePixelRatio || 1
      const { width, height } = entry.contentRect

      canvas.width = width * dpr
      canvas.height = height * dpr

      sizeRef.current = { width, height, dpr }
      gridCacheKeyRef.current = ""

      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      ctxRef.current = ctx
    })

    observer.observe(canvas)
    return () => {
      observer.disconnect()
    }
  }, [])

  const getGridCanvas = useCallback(() => {
    const { width, height, dpr } = sizeRef.current
    const cacheKey = [
      width,
      height,
      dpr,
      config.cols,
      config.rows,
      config.dotColor,
      config.bgColor,
      config.offOpacity,
      config.gapRatio,
    ].join(":")

    if (gridCanvasRef.current && gridCacheKeyRef.current === cacheKey) {
      return gridCanvasRef.current
    }

    const gridCanvas = gridCanvasRef.current ?? document.createElement("canvas")
    gridCanvas.width = Math.max(1, Math.round(width * dpr))
    gridCanvas.height = Math.max(1, Math.round(height * dpr))

    const gridCtx = gridCanvas.getContext("2d")
    if (!gridCtx) return null

    gridCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawDotGridToCanvas(gridCtx, config, width, height)
    gridCanvasRef.current = gridCanvas
    gridCacheKeyRef.current = cacheKey

    return gridCanvas
  }, [config])

  // Render loop
  const render = useCallback(
    (deltaMs: number, elapsedMs: number) => {
      const ctx = ctxRef.current
      if (!ctx) return

      const { width, height } = sizeRef.current
      if (width === 0 || height === 0) return

      const surface = surfaceRef.current
      clearBuffer(surface.buffer)
      clearColor(surface.color)

      const tms = transitionMsRef.current
      if (tms < TRANSITION_MS) {
        transitionMsRef.current = tms + deltaMs
        const t = Math.min(1, tms / TRANSITION_MS)
        if (t < 0.5) {
          // Fade OUT the frozen snapshot of the previous scene.
          const fromBuffer = fromBufferRef.current
          const fromColor = fromColorRef.current
          if (
            fromBuffer &&
            fromColor &&
            fromBuffer.length === surface.buffer.length &&
            fromColor.length === surface.color.length
          ) {
            surface.buffer.set(fromBuffer)
            surface.color.set(fromColor)
          }
          fadeBuffer(surface.buffer, easeInOutQuad(1 - t * 2))
        } else {
          // Fade IN the incoming scene.
          sceneRef.current.render({ ...surface, deltaMs, elapsedMs })
          fadeBuffer(surface.buffer, easeInOutQuad(t * 2 - 1))
        }
      } else {
        sceneRef.current.render({ ...surface, deltaMs, elapsedMs })
      }

      const gridCanvas = getGridCanvas()
      if (gridCanvas) {
        ctx.drawImage(gridCanvas, 0, 0, width, height)
      } else {
        drawDotGridToCanvas(ctx, config, width, height)
      }
      drawActiveDotsToCanvas(ctx, surface, config, width, height)
    },
    [config, getGridCanvas],
  )

  useAnimationFrame(render, DMD_TARGET_FPS)

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        width: "100vw",
        height: "100vh",
        background: config.bgColor,
      }}
    />
  )
}
