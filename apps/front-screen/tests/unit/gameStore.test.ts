import { beforeEach, describe, expect, it } from "vitest"
import { PLUNGER_BALL_SPAWN } from "@/components/plunger/plungerConfig"
import useBallStore from "@/stores/useBallStore"
import useGameStore from "@/stores/useGameStore"

describe("useGameStore", () => {
  beforeEach(() => {
    useGameStore.getState().reset()
    useBallStore.getState().resetBalls()
  })

  it("spawns exactly one idle ball in the plunger when the game starts", () => {
    useBallStore.getState().spawnBall([0, 0, 0], { isPlaying: true })

    useGameStore.getState().startGame({
      mode: "solo",
      players: [{ player: 1, character: "enforcer" }],
    })

    const { balls, playingBallIds } = useBallStore.getState()

    expect(useGameStore.getState().phase).toBe("playing")
    expect(balls).toHaveLength(1)
    expect(balls[0]?.position).toEqual(PLUNGER_BALL_SPAWN)
    expect(playingBallIds).toEqual([])
  })

  it("does not spend a player ball while another multiball ball remains active", () => {
    useBallStore.getState().spawnBall([0, 0, 0], { isPlaying: true })
    useBallStore.getState().spawnBall([1, 0, 0], { isPlaying: true })

    const [firstBall, secondBall] = useBallStore.getState().balls
    if (!firstBall || !secondBall) throw new Error("Expected two spawned balls")

    expect(useBallStore.getState().drainBall(firstBall.id)).toMatchObject({
      wasTracked: true,
      remainingBallCount: 1,
      remainingPlayingBallCount: 1,
      isLifeLost: false,
    })

    expect(useBallStore.getState().drainBall(secondBall.id)).toMatchObject({
      wasTracked: true,
      remainingBallCount: 0,
      remainingPlayingBallCount: 0,
      isLifeLost: true,
    })
  })

  it("waits for the total physical ball count to reach zero before spending a player ball", () => {
    useBallStore.getState().spawnBall([0, 0, 0], { isPlaying: true })
    useBallStore.getState().spawnBall(PLUNGER_BALL_SPAWN, { isPlaying: false })

    const activeBall = useBallStore.getState().balls[0]
    if (!activeBall) throw new Error("Expected a spawned active ball")

    expect(useBallStore.getState().drainBall(activeBall.id)).toMatchObject({
      wasTracked: true,
      remainingBallCount: 1,
      remainingPlayingBallCount: 0,
      isLifeLost: false,
    })
  })

  it("reports final ball only once ballNumber reaches totalBalls", () => {
    useGameStore.getState().startGame({
      mode: "solo",
      players: [{ player: 1, character: "enforcer" }],
    })

    expect(useGameStore.getState().isFinalBall()).toBe(false)

    useGameStore.getState().nextBall()
    expect(useGameStore.getState().isFinalBall()).toBe(false)

    useGameStore.getState().nextBall()
    expect(useGameStore.getState().isFinalBall()).toBe(true)
  })

  it("goes game over on the last ball without incrementing past totalBalls", () => {
    useGameStore.getState().startGame({
      mode: "solo",
      players: [{ player: 1, character: "enforcer" }],
    })

    useGameStore.getState().nextBall()
    expect(useGameStore.getState()).toMatchObject({ phase: "playing", ballNumber: 2 })

    useGameStore.getState().nextBall()
    expect(useGameStore.getState()).toMatchObject({ phase: "playing", ballNumber: 3 })

    useGameStore.getState().nextBall()
    expect(useGameStore.getState()).toMatchObject({ phase: "game_over", ballNumber: 3 })
  })
})
