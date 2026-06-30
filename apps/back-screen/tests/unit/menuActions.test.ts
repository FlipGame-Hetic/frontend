import { beforeEach, describe, expect, it, vi } from "vitest"
import { MENU_CONTROLS } from "@/components/controls/controlsConfig"
import { handleMenuButton } from "@/menu/menuActions"
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
    sendEventToMock.mockClear()
    useBackScreenStore.setState({
      phase: GAME_PHASE.ModeSelect,
      menuIndex: 0,
      creditsActive: false,
      selectedMode: null,
      selectedCharacter: null,
    })
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

  it("documents the cabinet hints without changing browser hints", () => {
    expect(MENU_CONTROLS.back.cabinet.token).toBe("L1")
    expect(MENU_CONTROLS.confirm.cabinet.token).toBe("R1")
    expect(MENU_CONTROLS.navigateLeft.cabinet.token).toBe("L2")
    expect(MENU_CONTROLS.navigateRight.cabinet.token).toBe("R2")
    expect(MENU_CONTROLS.back.browser).toEqual({ kind: "text", label: "ÉCHAP" })
    expect(MENU_CONTROLS.confirm.browser).toEqual({ kind: "text", label: "ENTRÉE" })
  })
})
