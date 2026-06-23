import { afterEach, describe, expect, it } from "vitest"
import { act, renderHook } from "@testing-library/react"
import {
  getBallColorForCharacter,
  getCharacterConfig,
  getCurrentBallColorSnapshot,
  getCurrentCharacterConfigSnapshot,
  useCurrentBallColor,
  useCurrentCharacterConfig,
} from "@/config/characterConfig"
import useGameStore from "@/stores/useGameStore"

afterEach(() => {
  act(() => {
    useGameStore.setState({ currentPlayer: 1, selectedPlayers: [] })
  })
})

describe("getCharacterConfig", () => {
  it("returns the matching character config", () => {
    expect(getCharacterConfig("viper").label).toBe("VIPER")
  })

  it("returns the default character config when character is undefined", () => {
    expect(getCharacterConfig(undefined).id).toBe("enforcer")
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
})

describe("current character config", () => {
  it("can read the current player config as an explicit snapshot", () => {
    useGameStore.setState({
      currentPlayer: 2,
      selectedPlayers: [{ player: 2, character: "viper" }],
    })

    expect(getCurrentCharacterConfigSnapshot().id).toBe("viper")
    expect(getCurrentBallColorSnapshot()).toBe("#7FFF00")
  })

  it("reacts to the active player's selected character", () => {
    act(() => {
      useGameStore.setState({
        currentPlayer: 2,
        selectedPlayers: [{ player: 2, character: "ghost" }],
      })
    })

    const { result: config } = renderHook(() => useCurrentCharacterConfig())
    const { result: color } = renderHook(() => useCurrentBallColor())

    expect(config.current.id).toBe("ghost")
    expect(color.current).toBe("#FF2D78")
  })
})
