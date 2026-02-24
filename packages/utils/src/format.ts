export function formatScore(score: number): string {
  return score.toString().padStart(6, "0");
}
