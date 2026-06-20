import { afterEach, describe, it, expect } from "vitest"
import { act, renderHook } from "@testing-library/react"
import {
  getBallColorForCharacter,
  getCurrentBallColorSnapshot,
  useCurrentBallColor,
} from "@/config/characterColors"
import useGameStore from "@/stores/useGameStore"

afterEach(() => {
  act(() => {
    useGameStore.setState({ currentPlayer: 1, selectedPlayers: [] })
  })
})

describe("getBallColorForCharacter", () => {
  it("returns orange for enforcer", () => {
    expect(getBallColorForCharacter("enforcer")).toBe("#FFAA00")
  })

  it("returns green for viper", () => {
    expect(getBallColorForCharacter("viper")).toBe("#7FFF00")
  })

  it("returns pink for ghost", () => {
    expect(getBallColorForCharacter("ghost")).toBe("#FF2D78")
  })

  it("returns silver for oracle", () => {
    expect(getBallColorForCharacter("oracle")).toBe("#C8D8E8")
  })

  it("returns enforcer color when character is undefined", () => {
    expect(getBallColorForCharacter(undefined)).toBe("#FFAA00")
  })

  it("can read the current player color as an explicit snapshot", () => {
    useGameStore.setState({
      currentPlayer: 2,
      selectedPlayers: [{ player: 2, character: "viper" }],
    })

    expect(getCurrentBallColorSnapshot()).toBe("#7FFF00")
  })

  it("reacts to the active player's selected character", () => {
    act(() => {
      useGameStore.setState({
        currentPlayer: 2,
        selectedPlayers: [{ player: 2, character: "ghost" }],
      })
    })

    const { result } = renderHook(() => useCurrentBallColor())

    expect(result.current).toBe("#FF2D78")
  })
})
