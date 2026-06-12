import { useEffect } from "react"
import { sendEventTo } from "@frontend/ws"
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

export function useKeyboardInput(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const { phase, menuIndex, setMenuIndex, setSelectedMode, setSelectedCharacter } =
        useBackScreenStore.getState()

      switch (phase) {
        case "idle": {
          if (e.key === "Enter") {
            playNavigationForward()
            sendEventTo("front_screen", {
              event_type: "menu_confirm",
              payload: { context: "idle" },
            })
          }
          break
        }

        case "mode_select": {
          if (e.key === "ArrowLeft") {
            playNavigationBackward()
            setMenuIndex(skipLocked(MODE_OPTIONS, menuIndex, -1))
          } else if (e.key === "ArrowRight") {
            playNavigationForward()
            setMenuIndex(skipLocked(MODE_OPTIONS, menuIndex, 1))
          } else if (e.key === "Enter") {
            const option = MODE_OPTIONS[menuIndex]
            if (!option || option.locked) return
            playNavigationForward()
            const mode = option.id
            setSelectedMode(mode)
            sendEventTo("front_screen", {
              event_type: "mode_selected",
              payload: { mode },
            })
          }
          break
        }

        case "game_over": {
          if (e.key === "Enter") {
            playNavigationForward()
            sendEventTo("front_screen", {
              event_type: "menu_confirm",
              payload: { context: "game_over" },
            })
          }
          break
        }

        case "character_select": {
          if (e.key === "ArrowLeft") {
            playNavigationBackward()
            setMenuIndex(skipLocked(CHARACTER_OPTIONS, menuIndex, -1))
          } else if (e.key === "ArrowRight") {
            playNavigationForward()
            setMenuIndex(skipLocked(CHARACTER_OPTIONS, menuIndex, 1))
          } else if (e.key === "Enter") {
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
                mode: useBackScreenStore.getState().selectedMode ?? "solo",
                players: [{ player: 1, character }],
              },
            })
          }
          break
        }
      }
    }

    window.addEventListener("keydown", handler)
    return () => {
      window.removeEventListener("keydown", handler)
    }
  }, [])
}
