import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Leaderboard } from "@/components/Leaderboard"
import type { ScoreEntry } from "@frontend/types"

describe("Leaderboard", () => {
  it("shows the character label next to each score", () => {
    const entries: ScoreEntry[] = [
      {
        id: 1,
        character_id: 2,
        score: 1354000,
        boss_reached: 1,
        created_at: null,
      },
    ]

    render(<Leaderboard entries={entries} />)

    expect(screen.getByText("1.354.000")).toBeInTheDocument()
    expect(screen.getByText("GHOST")).toBeInTheDocument()
    expect(screen.getByText("BOSS 1")).toBeInTheDocument()
  })
})
