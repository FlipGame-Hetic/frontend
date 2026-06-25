// Left-pads with zeros so the score always shows at least minDigits, keeping the arcade display width stable
export function padScore(score: number, minDigits = 6): string {
  return String(score).padStart(minDigits, "0")
}

// Inserts a dot before the last 3 digits, so 1234 reads as 001.234 like a real pinball counter
export function formatScore(score: number, minDigits = 6): string {
  const padded = padScore(score, minDigits)
  // Math.max(0, ...) guards scores shorter than 3 digits so slice never gets a negative index
  const splitAt = Math.max(0, padded.length - 3)
  return `${padded.slice(0, splitAt)}.${padded.slice(splitAt)}`
}
