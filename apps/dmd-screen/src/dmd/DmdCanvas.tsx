import { useCallback, useEffect, useRef } from "react"
import type { DmdConfig } from "./config"
import type { Scene } from "./types"
import { clearBuffer, createBuffer, drawDotsToCanvas } from "./buffer"
import { useAnimationFrame } from "./useAnimationFrame"

interface DmdCanvasProps {
  config: DmdConfig
  scene: Scene
}

export function DmdCanvas({ config, scene }: DmdCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sizeRef = useRef({ width: 0, height: 0 })
  const bufferRef = useRef(createBuffer(config.cols, config.rows))
  const sceneRef = useRef(scene)

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

      sizeRef.current = { width, height }

      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
    })

    observer.observe(canvas)
    return () => {
      observer.disconnect()
    }
  }, [])

  // Render loop
  const render = useCallback(
    (deltaMs: number, elapsedMs: number) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
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

      drawDotsToCanvas(ctx, buffer, config, width, height)
    },
    [config],
  )

  useAnimationFrame(render)

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
