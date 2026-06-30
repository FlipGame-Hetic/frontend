import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { MENU_CONTROLS } from "@/components/controls/controlsConfig"
import { GAME_OVER_BUTTON_STALE_MS, GAME_OVER_INPUT_LOCK_MS } from "@/menu/menuConfig"
import { handleMenuButton, menuBack, menuConfirm } from "@/menu/menuActions"
import { useBackScreenStore } from "@/stores/useBackScreenStore"
import { BUTTON_IDS, GAME_PHASE } from "@frontend/types"

const { sendEventToMock } = vi.hoisted(() => ({
  sendEventToMock: vi.fn(),
}))

vi.mock("@frontend/ws", () => ({
  sendEventTo: sendEventToMock,
}))

vi.mock("@/audio/menuSound", () => ({
  playNavigationBackward: vi.fn(),
  playNavigationForward: vi.fn(),
}))

vi.mock("@/audio/creditsMusic", () => ({
  playCreditsMusic: vi.fn(),
  stopCreditsMusic: vi.fn(),
}))

describe("handleMenuButton", () => {
  beforeEach(() => {
    vi.useRealTimers()
    sendEventToMock.mockClear()
    useBackScreenStore.setState({
      phase: GAME_PHASE.ModeSelect,
      menuIndex: 0,
      creditsActive: false,
      selectedMode: null,
      selectedCharacter: null,
      gameOverInputUnlockAt: 0,
    })
    handleMenuButton(BUTTON_IDS.flipperLeft, 0)
    handleMenuButton(BUTTON_IDS.flipperRight, 0)
    handleMenuButton(BUTTON_IDS.start, 0)
    handleMenuButton(BUTTON_IDS.extra1, 0)
    handleMenuButton(BUTTON_IDS.extra2, 0)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("uses L2 and R2 for menu navigation", () => {
    handleMenuButton(BUTTON_IDS.extra2)
    expect(useBackScreenStore.getState().menuIndex).toBe(2)

    handleMenuButton(BUTTON_IDS.extra1)
    expect(useBackScreenStore.getState().menuIndex).toBe(0)
  })

  it("uses L1 for back", () => {
    handleMenuButton(BUTTON_IDS.flipperLeft)

    expect(sendEventToMock).toHaveBeenCalledWith("front_screen", {
      event_type: "menu_back",
      payload: {},
    })
  })

  it("uses R1 and Start for confirm", () => {
    useBackScreenStore.setState({ phase: GAME_PHASE.Idle })

    handleMenuButton(BUTTON_IDS.flipperRight)
    handleMenuButton(BUTTON_IDS.start)

    expect(sendEventToMock).toHaveBeenCalledTimes(2)
    expect(sendEventToMock).toHaveBeenNthCalledWith(1, "front_screen", {
      event_type: "menu_confirm",
      payload: { context: GAME_PHASE.Idle },
    })
    expect(sendEventToMock).toHaveBeenNthCalledWith(2, "front_screen", {
      event_type: "menu_confirm",
      payload: { context: GAME_PHASE.Idle },
    })
  })

  it("ignores game over confirm until the input lock expires", () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    useBackScreenStore.getState().setPhase(GAME_PHASE.GameOver)

    menuConfirm()

    expect(sendEventToMock).not.toHaveBeenCalled()

    vi.advanceTimersByTime(GAME_OVER_INPUT_LOCK_MS)
    menuConfirm()

    expect(sendEventToMock).toHaveBeenCalledWith("front_screen", {
      event_type: "menu_confirm",
      payload: { context: GAME_PHASE.GameOver },
    })
  })

  it("ignores game over back until the input lock expires", () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    useBackScreenStore.getState().setPhase(GAME_PHASE.GameOver)

    menuBack()

    expect(sendEventToMock).not.toHaveBeenCalled()

    vi.advanceTimersByTime(GAME_OVER_INPUT_LOCK_MS)
    menuBack()

    expect(sendEventToMock).toHaveBeenCalledWith("front_screen", {
      event_type: "menu_back",
      payload: {},
    })
  })

  it("requires a new cabinet press after the game over input lock", () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    useBackScreenStore.getState().setPhase(GAME_PHASE.GameOver)

    handleMenuButton(BUTTON_IDS.flipperRight, 1)
    vi.advanceTimersByTime(GAME_OVER_INPUT_LOCK_MS)
    handleMenuButton(BUTTON_IDS.flipperRight, 1)

    expect(sendEventToMock).not.toHaveBeenCalled()

    handleMenuButton(BUTTON_IDS.flipperRight, 0)
    handleMenuButton(BUTTON_IDS.flipperRight, 1)

    expect(sendEventToMock).toHaveBeenCalledWith("front_screen", {
      event_type: "menu_confirm",
      payload: { context: GAME_PHASE.GameOver },
    })
  })

  it("blocks a cabinet button already held before game over until release", () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    useBackScreenStore.setState({ phase: GAME_PHASE.Playing })

    handleMenuButton(BUTTON_IDS.flipperRight, 1)
    useBackScreenStore.getState().setPhase(GAME_PHASE.GameOver)
    vi.advanceTimersByTime(GAME_OVER_INPUT_LOCK_MS)
    handleMenuButton(BUTTON_IDS.flipperRight, 1)

    expect(sendEventToMock).not.toHaveBeenCalled()

    handleMenuButton(BUTTON_IDS.flipperRight, 0)
    handleMenuButton(BUTTON_IDS.flipperRight, 1)

    expect(sendEventToMock).toHaveBeenCalledWith("front_screen", {
      event_type: "menu_confirm",
      payload: { context: GAME_PHASE.GameOver },
    })
  })

  it("unblocks a game over cabinet button when the release event is missed", () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    useBackScreenStore.getState().setPhase(GAME_PHASE.GameOver)

    handleMenuButton(BUTTON_IDS.flipperRight, 1)
    vi.advanceTimersByTime(GAME_OVER_INPUT_LOCK_MS)
    handleMenuButton(BUTTON_IDS.flipperRight, 1)

    expect(sendEventToMock).not.toHaveBeenCalled()

    vi.advanceTimersByTime(GAME_OVER_BUTTON_STALE_MS)
    handleMenuButton(BUTTON_IDS.flipperRight, 1)

    expect(sendEventToMock).toHaveBeenCalledWith("front_screen", {
      event_type: "menu_confirm",
      payload: { context: GAME_PHASE.GameOver },
    })
  })

  it("unblocks a button already held before game over when the release event is missed", () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    useBackScreenStore.setState({ phase: GAME_PHASE.Playing })

    handleMenuButton(BUTTON_IDS.flipperRight, 1)
    useBackScreenStore.getState().setPhase(GAME_PHASE.GameOver)
    vi.advanceTimersByTime(GAME_OVER_BUTTON_STALE_MS)
    handleMenuButton(BUTTON_IDS.flipperRight, 1)

    expect(sendEventToMock).toHaveBeenCalledWith("front_screen", {
      event_type: "menu_confirm",
      payload: { context: GAME_PHASE.GameOver },
    })
  })

  it("documents the cabinet hints without changing browser hints", () => {
    expect(MENU_CONTROLS.back.cabinet.token).toBe("L1")
    expect(MENU_CONTROLS.confirm.cabinet.token).toBe("R1")
    expect(MENU_CONTROLS.navigateLeft.cabinet.token).toBe("L2")
    expect(MENU_CONTROLS.navigateRight.cabinet.token).toBe("R2")
    expect(MENU_CONTROLS.back.browser).toEqual({ kind: "text", label: "ÉCHAP" })
    expect(MENU_CONTROLS.confirm.browser).toEqual({ kind: "text", label: "ENTRÉE" })
  })
})
