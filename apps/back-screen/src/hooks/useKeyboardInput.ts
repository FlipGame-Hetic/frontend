import { useEffect } from "react"
import { GAME_PHASE } from "@frontend/types"
import { menuBack, menuConfirm, menuLeft, menuRight } from "@/menu/menuActions"
import { useBackScreenStore } from "@/stores/useBackScreenStore"

export function useKeyboardInput(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat && useBackScreenStore.getState().phase === GAME_PHASE.GameOver) return

      switch (e.key) {
        case "ArrowLeft":
          menuLeft()
          break
        case "ArrowRight":
          menuRight()
          break
        case "Enter":
          menuConfirm()
          break
        case "Backspace":
        case "Escape":
          menuBack()
          break
      }
    }

    window.addEventListener("keydown", handler)
    return () => {
      window.removeEventListener("keydown", handler)
    }
  }, [])
}
