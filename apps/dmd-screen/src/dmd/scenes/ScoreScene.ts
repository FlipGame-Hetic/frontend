import { GAME_PHASE } from "@frontend/types"
import type { RenderContext, Scene } from "../types"
import { setPixel } from "../buffer"
import { drawString, measureString, drawStringScaledCentered } from "../font"
import { drawHearts } from "../icons"
import { drawCorners } from "../frame"
import { MAX_BALLS, heartsWidth } from "../constants"
import { padScore } from "@frontend/utils"

const BAR_WIDTH = 60
const BAR_Y = 14
const MULT_Y = 4
const SCORE_Y_RATIO = 0.38
const SCORE_SCALE = 2
const SCORE_SPACING = 2
const JITTER_THRESHOLD = 2.0
const JITTER_MAX_INTENSITY = 2
const HEARTS_MARGIN = 4

export interface ScoreData {
  score: number
  player: number
  totalPlayers: number
  ballNumber: number
  phase: string
  multiplier: number
  multiplierStartedAt: number
  multiplierDurationMs: number
  lives: number
  maxLives: number
}

export class ScoreScene implements Scene {
  private data: ScoreData = {
    score: 0,
    player: 1,
    totalPlayers: 1,
    ballNumber: 1,
    phase: GAME_PHASE.Idle,
    multiplier: 1,
    multiplierStartedAt: 0,
    multiplierDurationMs: 0,
    lives: MAX_BALLS,
    maxLives: MAX_BALLS,
  }

  update(data: Partial<ScoreData>): void {
    Object.assign(this.data, data)
  }

  render(ctx: RenderContext): void {
    const { buffer, cols, rows, elapsedMs } = ctx
    const { score, player, multiplier, multiplierStartedAt, multiplierDurationMs } = this.data

    const now = performance.now()
    const elapsed = now - multiplierStartedAt
    const remaining = multiplierDurationMs - elapsed
    const multActive = multiplier > 1.0 && remaining > 0

    if (multActive) {
      const multText = "X" + multiplier.toFixed(1)
      const multWidth = measureString(multText)
      let multX = Math.floor((cols - multWidth) / 2)
      let multY = MULT_Y

      if (multiplier >= JITTER_THRESHOLD) {
        const intensity = Math.min(
          JITTER_MAX_INTENSITY,
          Math.floor((multiplier - JITTER_THRESHOLD) * 2) + 1,
        )
        const jx =
          Math.round(Math.sin(elapsedMs / 28) * intensity) +
          (Math.random() < 0.4 ? (Math.random() < 0.5 ? -1 : 1) : 0)
        const jy = Math.random() < 0.25 ? (Math.random() < 0.5 ? -1 : 1) : 0
        multX += jx
        multY += jy
      }

      drawString(buffer, cols, multText, multX, multY, 1, 1.0)

      const barFill = Math.max(0, remaining / multiplierDurationMs)
      const barFilledPx = Math.round(barFill * BAR_WIDTH)
      const barX = Math.floor((cols - BAR_WIDTH) / 2)
      for (let i = 0; i < BAR_WIDTH; i++) {
        const brightness = i < barFilledPx ? 0.9 : 0.12
        setPixel(buffer, cols, barX + i, BAR_Y, brightness)
        setPixel(buffer, cols, barX + i, BAR_Y + 1, brightness)
      }
    }

    const scoreText = padScore(score)
    const scoreY = Math.floor(rows * SCORE_Y_RATIO)
    drawStringScaledCentered(buffer, cols, scoreText, scoreY, SCORE_SCALE, SCORE_SPACING)

    const { lives, maxLives } = this.data
    const playerText = "PLAYER " + String(player)
    const playerX = Math.floor(cols * 0.1)
    const infoY = rows - 9
    drawString(buffer, cols, playerText, playerX, infoY)

    const hx = cols - HEARTS_MARGIN - heartsWidth(maxLives)
    drawHearts(buffer, cols, hx, infoY, lives, maxLives)

    drawCorners(buffer, cols, rows)
  }
}
