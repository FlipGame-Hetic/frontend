export interface MutableRgb {
  r: number
  g: number
  b: number
}

const DEFAULT_COLOR = "#FFAA00"

const isHexDigit = (value: string): boolean => {
  const code = value.charCodeAt(0)
  return (code >= 48 && code <= 57) || (code >= 65 && code <= 70) || (code >= 97 && code <= 102)
}

const setDefaultRgb = (target: MutableRgb): void => {
  target.r = 1
  target.g = 0.667
  target.b = 0
}

const setFromSixDigitHex = (value: string, target: MutableRgb): boolean => {
  if (value.length !== 7 || !value.startsWith("#")) return false
  for (let i = 1; i < 7; i += 1) {
    if (!isHexDigit(value[i] ?? "")) return false
  }

  target.r = Number.parseInt(value.slice(1, 3), 16) / 255
  target.g = Number.parseInt(value.slice(3, 5), 16) / 255
  target.b = Number.parseInt(value.slice(5, 7), 16) / 255
  return true
}

const setFromThreeDigitHex = (value: string, target: MutableRgb): boolean => {
  if (value.length !== 4 || !value.startsWith("#")) return false
  for (let i = 1; i < 4; i += 1) {
    if (!isHexDigit(value[i] ?? "")) return false
  }

  const r = value[1] ?? "F"
  const g = value[2] ?? "A"
  const b = value[3] ?? "0"
  target.r = Number.parseInt(r + r, 16) / 255
  target.g = Number.parseInt(g + g, 16) / 255
  target.b = Number.parseInt(b + b, 16) / 255
  return true
}

export const setRgbFromColor = (
  color: string | undefined,
  fallback: string | undefined,
  target: MutableRgb,
): void => {
  const value = color?.trim() ?? fallback?.trim() ?? DEFAULT_COLOR
  if (setFromSixDigitHex(value, target)) return
  if (setFromThreeDigitHex(value, target)) return
  if (fallback && fallback !== value && setFromSixDigitHex(fallback, target)) return
  setDefaultRgb(target)
}
