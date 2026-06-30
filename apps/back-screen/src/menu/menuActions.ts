import { sendEventTo } from "@frontend/ws"
import { BUTTON_IDS, GAME_PHASE, type ButtonId } from "@frontend/types"
import { playNavigationBackward, playNavigationForward } from "@/audio/menuSound"
import { playCreditsMusic, stopCreditsMusic } from "@/audio/creditsMusic"
import { useBackScreenStore } from "@/stores/useBackScreenStore"
import { MODE_OPTIONS, CHARACTER_OPTIONS } from "@/scenes/scene.types"

const gameOverButtonsBlockedUntilRelease = new Set<ButtonId>()
const pressedMenuButtons = new Set<ButtonId>()
const gameOverSceneChangeButtons = new Set<ButtonId>([
  BUTTON_IDS.flipperLeft,
  BUTTON_IDS.flipperRight,
  BUTTON_IDS.start,
])

function isGameOverInputLocked(): boolean {
  const { phase, gameOverInputUnlockAt } = useBackScreenStore.getState()
  return phase === GAME_PHASE.GameOver && Date.now() < gameOverInputUnlockAt
}

function shouldIgnoreGameOverButtonInput(id: ButtonId, wasPressed: boolean): boolean {
  if (!gameOverSceneChangeButtons.has(id)) return false

  const { phase } = useBackScreenStore.getState()
  if (phase !== GAME_PHASE.GameOver) return false

  if (isGameOverInputLocked() || wasPressed) {
    gameOverButtonsBlockedUntilRelease.add(id)
    return true
  }

  return gameOverButtonsBlockedUntilRelease.has(id)
}

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
  const { phase, menuIndex, setMenuIndex, creditsActive } = useBackScreenStore.getState()
  if (creditsActive) return
  if (phase === GAME_PHASE.ModeSelect) {
    playNavigationBackward()
    setMenuIndex(skipLocked(MODE_OPTIONS, menuIndex, -1))
  } else if (phase === GAME_PHASE.CharacterSelect) {
    playNavigationBackward()
    setMenuIndex(skipLocked(CHARACTER_OPTIONS, menuIndex, -1))
  }
}

export function menuRight(): void {
  const { phase, menuIndex, setMenuIndex, creditsActive } = useBackScreenStore.getState()
  if (creditsActive) return
  if (phase === GAME_PHASE.ModeSelect) {
    playNavigationForward()
    setMenuIndex(skipLocked(MODE_OPTIONS, menuIndex, 1))
  } else if (phase === GAME_PHASE.CharacterSelect) {
    playNavigationForward()
    setMenuIndex(skipLocked(CHARACTER_OPTIONS, menuIndex, 1))
  }
}

export function menuConfirm(): void {
  const {
    phase,
    menuIndex,
    creditsActive,
    setSelectedMode,
    setSelectedCharacter,
    setCreditsActive,
  } = useBackScreenStore.getState()

  if (creditsActive) return

  switch (phase) {
    case GAME_PHASE.Idle: {
      playNavigationForward()
      sendEventTo("front_screen", {
        event_type: "menu_confirm",
        payload: { context: GAME_PHASE.Idle },
      })
      break
    }
    case GAME_PHASE.GameOver: {
      if (isGameOverInputLocked()) return
      playNavigationForward()
      sendEventTo("front_screen", {
        event_type: "menu_confirm",
        payload: { context: GAME_PHASE.GameOver },
      })
      break
    }
    case GAME_PHASE.ModeSelect: {
      const option = MODE_OPTIONS[menuIndex]
      if (!option || option.locked) return
      playNavigationForward()
      if (option.id === "credits") {
        setCreditsActive(true)
        sendEventTo("front_screen", { event_type: "playfield_music", payload: { playing: false } })
        playCreditsMusic()
        break
      }
      const mode = option.id
      setSelectedMode(mode)
      sendEventTo("front_screen", { event_type: "mode_selected", payload: { mode } })
      break
    }
    case GAME_PHASE.CharacterSelect: {
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
  const { phase, creditsActive, setCreditsActive } = useBackScreenStore.getState()
  if (creditsActive) {
    playNavigationBackward()
    stopCreditsMusic()
    sendEventTo("front_screen", { event_type: "playfield_music", payload: { playing: true } })
    setCreditsActive(false)
    return
  }
  if (phase === GAME_PHASE.Idle || phase === GAME_PHASE.Playing || phase === GAME_PHASE.Paused)
    return
  if (phase === GAME_PHASE.GameOver && isGameOverInputLocked()) return
  playNavigationBackward()
  sendEventTo("front_screen", { event_type: "menu_back", payload: {} })
}

const menuButtonHandlers: Record<ButtonId, () => void> = {
  [BUTTON_IDS.flipperLeft]: menuBack,
  [BUTTON_IDS.flipperRight]: menuConfirm,
  [BUTTON_IDS.start]: menuConfirm,
  [BUTTON_IDS.extra1]: menuLeft,
  [BUTTON_IDS.extra2]: menuRight,
}

export function handleMenuButton(id: ButtonId, state = 1): void {
  const wasPressed = pressedMenuButtons.has(id)

  if (state <= 0) {
    pressedMenuButtons.delete(id)
    gameOverButtonsBlockedUntilRelease.delete(id)
    return
  }

  pressedMenuButtons.add(id)
  if (shouldIgnoreGameOverButtonInput(id, wasPressed)) return
  menuButtonHandlers[id]()
}
