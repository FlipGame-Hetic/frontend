import { beforeEach, describe, expect, it } from "vitest"
import { GAME_PHASE } from "@frontend/types"
import { LAST_CHARACTER_STORAGE_KEY, useBackScreenStore } from "@/stores/useBackScreenStore"

describe("useBackScreenStore character persistence", () => {
  beforeEach(() => {
    localStorage.clear()
    useBackScreenStore.setState({
      phase: GAME_PHASE.Idle,
      menuIndex: 0,
      creditsActive: false,
      selectedMode: null,
      selectedCharacter: null,
    })
  })

  it("stores the selected character locally", () => {
    useBackScreenStore.getState().setSelectedCharacter("ghost")

    expect(localStorage.getItem(LAST_CHARACTER_STORAGE_KEY)).toBe("ghost")
  })

  it("selects the stored character by default when entering character select", () => {
    localStorage.setItem(LAST_CHARACTER_STORAGE_KEY, "ghost")

    useBackScreenStore.getState().setPhase(GAME_PHASE.CharacterSelect)

    expect(useBackScreenStore.getState().menuIndex).toBe(2)
  })

  it("falls back to the first character when storage is invalid", () => {
    localStorage.setItem(LAST_CHARACTER_STORAGE_KEY, "not-a-character")
    useBackScreenStore.setState({ menuIndex: 3 })

    useBackScreenStore.getState().setPhase(GAME_PHASE.CharacterSelect)

    expect(useBackScreenStore.getState().menuIndex).toBe(0)
  })
})
