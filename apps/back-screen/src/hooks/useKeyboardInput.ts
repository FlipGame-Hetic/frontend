import { useEffect } from "react"
import { menuBack, menuConfirm, menuLeft, menuRight } from "@/menu/menuActions"

export function useKeyboardInput(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
