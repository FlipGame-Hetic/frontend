import { sendEventTo } from "@frontend/ws"
import { BUTTON_IDS, type ButtonId } from "@frontend/types"
import { playNavigationBackward, playNavigationForward } from "@/audio/menuSound"
import { useBackScreenStore } from "@/stores/useBackScreenStore"
import { MODE_OPTIONS, CHARACTER_OPTIONS } from "@/scenes/scene.types"

function skipLocked(options: { locked?: boolean }[], from: number, dir: 1 | -1): number {
  const len = options.length
  let idx = (from + dir + len) % len
  let steps = len - 1
  while (steps > 0 && options[idx]?.locked) {
    idx = (idx + dir + len) % len
    steps--
  }
  return options[idx]?.locked ? from : idx
}

export function menuLeft(): void {
  const { phase, menuIndex, setMenuIndex } = useBackScreenStore.getState()
  if (phase === "mode_select") {
    playNavigationBackward()
    setMenuIndex(skipLocked(MODE_OPTIONS, menuIndex, -1))
  } else if (phase === "character_select") {
    playNavigationBackward()
    setMenuIndex(skipLocked(CHARACTER_OPTIONS, menuIndex, -1))
  }
}

export function menuRight(): void {
  const { phase, menuIndex, setMenuIndex } = useBackScreenStore.getState()
  if (phase === "mode_select") {
    playNavigationForward()
    setMenuIndex(skipLocked(MODE_OPTIONS, menuIndex, 1))
  } else if (phase === "character_select") {
    playNavigationForward()
    setMenuIndex(skipLocked(CHARACTER_OPTIONS, menuIndex, 1))
  }
}

export function menuConfirm(): void {
  const { phase, menuIndex, setSelectedMode, setSelectedCharacter } = useBackScreenStore.getState()

  switch (phase) {
    case "idle": {
      playNavigationForward()
      sendEventTo("front_screen", { event_type: "menu_confirm", payload: { context: "idle" } })
      break
    }
    case "game_over": {
      playNavigationForward()
      sendEventTo("front_screen", { event_type: "menu_confirm", payload: { context: "game_over" } })
      break
    }
    case "mode_select": {
      const option = MODE_OPTIONS[menuIndex]
      if (!option || option.locked) return
      playNavigationForward()
      const mode = option.id
      setSelectedMode(mode)
      sendEventTo("front_screen", { event_type: "mode_selected", payload: { mode } })
      break
    }
    case "character_select": {
      const charOption = CHARACTER_OPTIONS[menuIndex]
      if (!charOption || charOption.locked) return
      playNavigationForward()
      const character = charOption.id
      setSelectedCharacter(character)
      sendEventTo("front_screen", {
        event_type: "character_selected",
        payload: { player: 1, character },
      })
      sendEventTo("front_screen", {
        event_type: "start_game",
        payload: {
          mode: useBackScreenStore.getState().selectedMode ?? "boss",
          players: [{ player: 1, character }],
        },
      })
      break
    }
  }
}

export function menuBack(): void {
  const { phase } = useBackScreenStore.getState()
  if (phase === "idle" || phase === "playing" || phase === "paused") return
  playNavigationBackward()
  sendEventTo("front_screen", { event_type: "menu_back", payload: {} })
}

export function handleMenuButton(id: ButtonId): void {
  switch (id) {
    case BUTTON_IDS.flipperLeft:
      menuLeft()
      break
    case BUTTON_IDS.flipperRight:
      menuRight()
      break
    case BUTTON_IDS.extra2:
    case BUTTON_IDS.start:
      menuConfirm()
      break
    case BUTTON_IDS.extra1:
      menuBack()
      break
  }
}
