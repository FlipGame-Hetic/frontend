import { resolveApiUrl } from "@frontend/ws"
import type { ScoreEntry } from "@frontend/types"

export async function fetchLeaderboard(): Promise<ScoreEntry[]> {
  try {
    const res = await fetch(`${resolveApiUrl()}/api/v1/scores`)
    if (!res.ok) return []
    const json = (await res.json()) as { scores?: ScoreEntry[] }
    return json.scores ?? []
  } catch {
    return []
  }
}
