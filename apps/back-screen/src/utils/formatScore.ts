export function formatScore(n: number): string {
  return String(n)
    .padStart(6, "0")
    .replace(/(\d{3})(\d{3})/, "$1.$2")
}
