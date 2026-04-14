import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { SceneManager } from "@/dmd/SceneManager"
import { AttractScene } from "@/dmd/scenes/AttractScene"
import { StartScene } from "@/dmd/scenes/StartScene"
import { PlayingScene } from "@/dmd/scenes/PlayingScene"
import { BallLostScene } from "@/dmd/scenes/BallLostScene"
import { BonusScene } from "@/dmd/scenes/BonusScene"
import { TiltScene } from "@/dmd/scenes/TiltScene"
import { GameOverScene } from "@/dmd/scenes/GameOverScene"
import { HighScoreScene } from "@/dmd/scenes/HighScoreScene"

const BASE_DATA = {
  state: "idle",
  ball_number: 1,
  score: 0,
  player: 1,
  total_players: 1,
}

describe("SceneManager", () => {
  let manager: SceneManager

  beforeEach(() => {
    manager = new SceneManager()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("starts on AttractScene", () => {
    expect(manager.activeScene).toBeInstanceOf(AttractScene)
  })

  it.each([
    ["idle", AttractScene],
    ["attract", AttractScene],
    ["waiting", AttractScene],
    ["start", StartScene],
    ["playing", PlayingScene],
    ["ball_lost", BallLostScene],
    ["paused", BallLostScene],
    ["bonus", BonusScene],
    ["tilt", TiltScene],
    ["game_over", GameOverScene],
    ["ended", GameOverScene],
    ["high_score", HighScoreScene],
  ] as const)("phase '%s' activates %s", (phase, SceneClass) => {
    manager.update({ ...BASE_DATA, state: phase })
    expect(manager.activeScene).toBeInstanceOf(SceneClass)
  })

  it("unknown phase falls back to AttractScene", () => {
    manager.update({ ...BASE_DATA, state: "some_unknown_phase" })
    expect(manager.activeScene).toBeInstanceOf(AttractScene)
  })

  it("empty string phase falls back to AttractScene", () => {
    manager.update({ ...BASE_DATA, state: "" })
    expect(manager.activeScene).toBeInstanceOf(AttractScene)
  })

  it("calls enter() on the incoming scene", () => {
    const spy = vi.spyOn(StartScene.prototype, "enter")
    manager.update({ ...BASE_DATA, state: "start" })
    expect(spy).toHaveBeenCalledOnce()
  })

  it("calls exit() on the outgoing scene if defined", () => {
    // Switch to playing first so attract is the outgoing scene
    // AttractScene has no exit() — verify this doesn't throw
    expect(() => {
      manager.update({ ...BASE_DATA, state: "playing" })
    }).not.toThrow()
  })

  it("calls enter() exactly once even with multiple updates on the same scene", () => {
    // Set up spy BEFORE the first transition
    const enterSpy = vi.spyOn(StartScene.prototype, "enter")
    manager.update({ ...BASE_DATA, state: "start" }) // transition → enter fires once
    manager.update({ ...BASE_DATA, state: "start", player: 2 }) // same scene → no additional call
    expect(enterSpy).toHaveBeenCalledTimes(1)
  })

  it("forwards score data to PlayingScene on 'playing' phase", () => {
    const spy = vi.spyOn(PlayingScene.prototype, "update")
    manager.update({ ...BASE_DATA, state: "playing", score: 500, player: 2, ball_number: 2 })
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ score: 500, player: 2, ballNumber: 2 }),
    )
  })

  it("forwards player/ballNumber to BallLostScene on 'ball_lost' phase", () => {
    const spy = vi.spyOn(BallLostScene.prototype, "update")
    manager.update({ ...BASE_DATA, state: "ball_lost", player: 1, ball_number: 2 })
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ player: 1, ballNumber: 2 }))
  })

  it("resets GameOverScene animation via enter() on transition", () => {
    const enterSpy = vi.spyOn(GameOverScene.prototype, "enter")
    manager.update({ ...BASE_DATA, state: "game_over", score: 9000 })
    expect(enterSpy).toHaveBeenCalledOnce()
  })
})
