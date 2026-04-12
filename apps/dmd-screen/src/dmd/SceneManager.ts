import type { Scene } from "./types"
import { AttractScene } from "./scenes/AttractScene"
import { StartScene } from "./scenes/StartScene"
import { PlayingScene } from "./scenes/PlayingScene"
import { BallLostScene } from "./scenes/BallLostScene"
import { BonusScene } from "./scenes/BonusScene"
import { TiltScene } from "./scenes/TiltScene"
import { GameOverScene } from "./scenes/GameOverScene"
import { HighScoreScene } from "./scenes/HighScoreScene"

export interface GameData {
  state: string
  ball_number: number
  score: number
  player: number
  total_players: number
}

export class SceneManager {
  private attract = new AttractScene()
  private start = new StartScene()
  private playing = new PlayingScene()
  private ballLost = new BallLostScene()
  private bonus = new BonusScene()
  private tilt = new TiltScene()
  private gameOver = new GameOverScene()
  private highScore = new HighScoreScene()

  activeScene: Scene = this.attract

  update(data: GameData): void {
    const next = this.sceneForPhase(data.state)

    if (next !== this.activeScene) {
      this.activeScene.exit?.()
      next.enter?.()
      this.activeScene = next
    }

    // Forward data to scenes that need game state
    switch (data.state) {
      case "start":
        this.start.update({ player: data.player, totalPlayers: data.total_players })
        break
      case "playing":
        this.playing.update({
          score: data.score,
          player: data.player,
          totalPlayers: data.total_players,
          ballNumber: data.ball_number,
        })
        break
      case "ball_lost":
        this.ballLost.update({ player: data.player, ballNumber: data.ball_number })
        break
      case "bonus":
        this.bonus.update({ score: data.score, player: data.player })
        break
      case "game_over":
        this.gameOver.update({ score: data.score, player: data.player })
        break
      case "high_score":
        this.highScore.update({ score: data.score, player: data.player })
        break
    }
  }

  private sceneForPhase(phase: string): Scene {
    switch (phase) {
      case "idle":
      case "attract":
      case "waiting": // legacy frontend alias
        return this.attract
      case "start":
        return this.start
      case "playing":
        return this.playing
      case "ball_lost":
      case "paused": // legacy frontend alias
        return this.ballLost
      case "bonus":
        return this.bonus
      case "tilt":
        return this.tilt
      case "game_over":
      case "ended": // legacy frontend alias
        return this.gameOver
      case "high_score":
        return this.highScore
      default:
        return this.attract
    }
  }
}
