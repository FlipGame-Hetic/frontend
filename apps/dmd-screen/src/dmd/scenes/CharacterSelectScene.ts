import type { RenderContext, Scene } from "../types"
import { drawString, measureString } from "../font"

export class CharacterSelectScene implements Scene {
  private character = ""

  update(character: string): void {
    this.character = character.toUpperCase()
  }

  render({ buffer, cols, rows, elapsedMs }: RenderContext): void {
    const title = "PICK FIGHTER"
    const titleW = measureString(title)
    drawString(buffer, cols, title, Math.floor((cols - titleW) / 2), Math.floor(rows * 0.15))

    if (this.character) {
      const blink = Math.floor(elapsedMs / 500) % 2 === 0
      if (blink) {
        const charW = measureString(this.character)
        drawString(
          buffer,
          cols,
          this.character,
          Math.floor((cols - charW) / 2),
          Math.floor(rows * 0.55),
        )
      }
    }

    const hint = "< SELECT >"
    const hintW = measureString(hint)
    drawString(buffer, cols, hint, Math.floor((cols - hintW) / 2), rows - 10, 1, 0.4)
  }
}
