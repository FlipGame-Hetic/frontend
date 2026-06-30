// Left-pads with zeros so the score always shows at least minDigits, keeping the arcade display width stable
export function padScore(score: number, minDigits = 6): string {
  return String(score).padStart(minDigits, "0")
}

// Inserts dots between all groups of 3 digits, so 1234567 reads as 1.234.567.
export function formatScore(score: number, minDigits = 6): string {
  const padded = padScore(score, minDigits)
  return padded.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}
