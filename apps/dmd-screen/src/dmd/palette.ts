/**
 * Per-cell color support for the DMD. Colors are packed into a Uint32: the low
 * 24 bits hold 0xRRGGBB and bit 24 (SET_FLAG) marks the cell as having an
 * explicit color. A cell value of 0 means "unset" — the renderer falls back to
 * the global config.dotColor.
 */

export type ColorInput = string | [number, number, number] | number

/** Bit 24: set when a cell holds an explicit color (distinguishes unset from black). */
const SET_FLAG = 0x1000000

const RGB_MASK = 0xffffff

/** Named palette. Hexes align with the project theme where available. */
export const PALETTE: Record<string, number> = {
  orange: 0xff8c00, // current DMD default color
  pink: 0xff2d6b,
  cyan: 0x00f0ff,
  purple: 0xb026ff,
  yellow: 0xffe156,
  green: 0x39ff14,
  red: 0xff3131,
  blue: 0x2d6bff,
  white: 0xe8f4ff,
}

function packHex(hex: string): number | null {
  const h = hex.startsWith("#") ? hex.slice(1) : hex
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return parseInt(h, 16) & RGB_MASK
}

/**
 * Resolves a {@link ColorInput} to a packed cell value (`0xRRGGBB | SET_FLAG`).
 * Unknown palette names / bad hex resolve to `0` (unset → default color) + warn.
 */
export function resolveColor(c: ColorInput): number {
  if (typeof c === "number") return (c & RGB_MASK) | SET_FLAG
  if (Array.isArray(c)) {
    const [r, g, b] = c
    return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff) | SET_FLAG
  }
  if (c.startsWith("#")) {
    const packed = packHex(c)
    if (packed === null) {
      console.warn("resolveColor: invalid hex color '" + c + "'")
      return 0
    }
    return packed | SET_FLAG
  }
  const named = PALETTE[c]
  if (named === undefined) {
    console.warn("resolveColor: unknown palette color '" + c + "'")
    return 0
  }
  return named | SET_FLAG
}

/** True when a color buffer cell holds an explicit color. */
export function isColorSet(cell: number): boolean {
  return (cell & SET_FLAG) !== 0
}

/** Extracts [r, g, b] (0–255) from a packed cell's low 24 bits. */
export function unpackRgb(cell: number): [number, number, number] {
  return [(cell >> 16) & 0xff, (cell >> 8) & 0xff, cell & 0xff]
}
