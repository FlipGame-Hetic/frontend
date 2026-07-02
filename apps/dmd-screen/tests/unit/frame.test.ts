import { describe, it, expect } from "vitest"
import { createBuffer } from "@/dmd/buffer"
import { drawCorners } from "@/dmd/frame"

const COLS = 16
const ROWS = 8

describe("drawCorners", () => {
  it("lights the three outermost dots of each corner at the given brightness", () => {
    const buf = createBuffer(COLS, ROWS)
    drawCorners(buf, COLS, ROWS)

    // top-left
    expect(buf[0]).toBeCloseTo(0.3)
    expect(buf[2]).toBeCloseTo(0.3)
    // top-right
    expect(buf[COLS - 1]).toBeCloseTo(0.3)
    // bottom-left
    expect(buf[(ROWS - 1) * COLS]).toBeCloseTo(0.3)
    // bottom-right
    expect(buf[ROWS * COLS - 1]).toBeCloseTo(0.3)
  })

  it("leaves the interior untouched", () => {
    const buf = createBuffer(COLS, ROWS)
    drawCorners(buf, COLS, ROWS)
    // a dot well inside the frame
    expect(buf[3 * COLS + 8]).toBe(0)
  })
})
