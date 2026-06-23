export function padScore(score: number, minDigits = 6): string {
  return String(score).padStart(minDigits, "0")
}

export function formatScore(score: number, minDigits = 6): string {
  const padded = padScore(score, minDigits)
  const splitAt = Math.max(0, padded.length - 3)
  return `${padded.slice(0, splitAt)}.${padded.slice(splitAt)}`
}
