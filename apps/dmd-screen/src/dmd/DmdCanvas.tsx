import { useCallback, useEffect, useRef } from "react"
import type { DmdConfig } from "./config"
import type { Scene } from "./types"
import { clearBuffer, createBuffer, drawActiveDotsToCanvas, drawDotGridToCanvas } from "./buffer"
import { useAnimationFrame } from "./useAnimationFrame"

const DMD_TARGET_FPS = 30

interface DmdCanvasProps {
  config: DmdConfig
  scene: Scene
}

export function DmdCanvas({ config, scene }: DmdCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 })
  const bufferRef = useRef(createBuffer(config.cols, config.rows))
  const sceneRef = useRef(scene)
  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const gridCacheKeyRef = useRef("")

  // Keep scene ref in sync
  useEffect(() => {
    sceneRef.current = scene
  })

  // Recreate buffer when grid size changes
  useEffect(() => {
    bufferRef.current = createBuffer(config.cols, config.rows)
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

      const buffer = bufferRef.current
      clearBuffer(buffer)

      sceneRef.current.render({
        buffer,
        cols: config.cols,
        rows: config.rows,
        deltaMs,
        elapsedMs,
      })

      const gridCanvas = getGridCanvas()
      if (gridCanvas) {
        ctx.drawImage(gridCanvas, 0, 0, width, height)
      } else {
        drawDotGridToCanvas(ctx, config, width, height)
      }
      drawActiveDotsToCanvas(ctx, buffer, config, width, height)
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
