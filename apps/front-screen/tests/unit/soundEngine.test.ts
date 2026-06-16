import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { LOOPING_SFX_FADE_OUT_MS } from "@/audio/soundConfig"

interface MockHowlOptions {
  loop?: boolean
  pool?: number
  src: string[]
  volume?: number
  onplay?: () => void
  onend?: () => void
}

interface MockHowlInstance {
  fadeCalls: { duration: number; from: number; id?: number; to: number }[]
  fade: (from: number, to: number, duration: number, id?: number) => MockHowlInstance
  options: MockHowlOptions
  playCalls: number
  src: string[]
  stopCalls: (number | undefined)[]
  play: () => number
  stop: (id?: number) => void
  unload: () => void
  pause: () => void
  volume: (value?: number) => number
  seek: () => number
}

const { connectMusicNode, howlInstances } = vi.hoisted(() => ({
  connectMusicNode: vi.fn(),
  howlInstances: [] as MockHowlInstance[],
}))

vi.mock("@/audio/musicAnalyser", () => ({
  connectMusicNode,
}))

vi.mock("howler", () => ({
  Howl: class implements MockHowlInstance {
    fadeCalls: { duration: number; from: number; id?: number; to: number }[] = []
    options: MockHowlOptions
    playCalls = 0
    src: string[]
    stopCalls: (number | undefined)[] = []
    private currentVolume: number
    private nextSoundId = 1

    constructor(options: MockHowlOptions) {
      this.options = options
      this.src = options.src
      this.currentVolume = options.volume ?? 1
      howlInstances.push(this)
    }

    play() {
      this.playCalls += 1
      this.options.onplay?.()
      return this.nextSoundId++
    }

    fade(from: number, to: number, duration: number, id?: number) {
      this.fadeCalls.push({ from, to, duration, id })
      this.currentVolume = to
      return this
    }

    stop(id?: number) {
      this.stopCalls.push(id)
      return undefined
    }

    unload() {
      return undefined
    }

    pause() {
      return undefined
    }

    volume(value?: number) {
      if (value !== undefined) this.currentVolume = value
      return this.currentVolume
    }

    seek() {
      return 0
    }
  },
}))

const loadSoundEngine = async () => {
  vi.resetModules()
  return import("@/audio/soundEngine")
}

const latestHowl = (): MockHowlInstance => {
  const howl = howlInstances[howlInstances.length - 1]
  if (!howl) throw new Error("Expected a music Howl instance")
  return howl
}

const endLatestTrack = () => {
  latestHowl().options.onend?.()
}

const trackIndexFromSrc = (src: string): number => {
  const match = /sounds\/music\/(\d+)\.mp3$/.exec(src)
  const trackNumber = match?.[1]
  if (!trackNumber) throw new Error(`Unexpected music src: ${src}`)
  return Number(trackNumber) - 1
}

const playedTrackIndexes = (): number[] =>
  howlInstances.map((howl) => trackIndexFromSrc(howl.src[0] ?? ""))

describe("soundEngine music playlist", () => {
  beforeEach(() => {
    howlInstances.length = 0
    connectMusicNode.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("can start on a random track instead of always forcing track 1", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0)
    const { startMusic } = await loadSoundEngine()

    startMusic()

    expect(playedTrackIndexes()[0]).toBe(1)
  })

  it("plays every track once before repeating within a shuffled queue", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0)
    const { startMusic } = await loadSoundEngine()

    startMusic()
    for (let i = 0; i < 6; i++) endLatestTrack()

    expect(playedTrackIndexes()).toHaveLength(7)
    expect(new Set(playedTrackIndexes()).size).toBe(7)
  })

  it("does not repeat the last track immediately when a new queue starts", async () => {
    const randomValues = [
      ...Array.from({ length: 6 }, () => 0),
      ...Array.from({ length: 6 }, () => 0.999),
    ]
    vi.spyOn(Math, "random").mockImplementation(() => randomValues.shift() ?? 0.999)
    const { startMusic } = await loadSoundEngine()

    startMusic()
    for (let i = 0; i < 7; i++) endLatestTrack()

    const played = playedTrackIndexes()
    expect(played[6]).toBe(0)
    expect(played[7]).not.toBe(0)
  })

  it("forces a Leva-selected track and removes it from the pending queue", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0)
    const { setMusicTrack, startMusic } = await loadSoundEngine()

    startMusic()
    setMusicTrack(2)
    endLatestTrack()

    expect(playedTrackIndexes()).toEqual([1, 2, 3])
  })

  it("notifies listeners when the current music track changes", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0)
    const { onMusicChange, setMusicTrack, startMusic } = await loadSoundEngine()
    const changes: number[] = []

    const unsubscribe = onMusicChange((index) => {
      changes.push(index)
    })

    startMusic()
    setMusicTrack(2)
    unsubscribe()
    setMusicTrack(3)

    expect(changes).toEqual([1, 2])
  })
})

describe("soundEngine looping sfx", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    howlInstances.length = 0
    connectMusicNode.mockClear()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("starts one loop for multiple active keys", async () => {
    const { startLoopingSfx, stopLoopingSfx } = await loadSoundEngine()

    startLoopingSfx("ramp_rolling", "ball-1")
    startLoopingSfx("ramp_rolling", "ball-2")

    const loop = latestHowl()
    expect(loop.options.loop).toBe(true)
    expect(loop.playCalls).toBe(1)

    stopLoopingSfx("ramp_rolling", "ball-1")
    expect(loop.stopCalls).toEqual([])

    stopLoopingSfx("ramp_rolling", "ball-2")
    expect(loop.fadeCalls).toEqual([{ from: 0.4, to: 0, duration: LOOPING_SFX_FADE_OUT_MS, id: 1 }])
    expect(loop.stopCalls).toEqual([])

    vi.advanceTimersByTime(LOOPING_SFX_FADE_OUT_MS)
    expect(loop.stopCalls).toEqual([1])
  })

  it("keeps a loop active until the final key stops", async () => {
    const { startLoopingSfx, stopLoopingSfx } = await loadSoundEngine()

    startLoopingSfx("ramp_rolling", "ball-1")
    startLoopingSfx("ramp_rolling", "ball-2")
    stopLoopingSfx("ramp_rolling", "ball-1")
    startLoopingSfx("ramp_rolling", "ball-3")
    stopLoopingSfx("ramp_rolling", "ball-2")

    const loop = latestHowl()
    expect(loop.playCalls).toBe(1)
    expect(loop.stopCalls).toEqual([])

    stopLoopingSfx("ramp_rolling", "ball-3")
    expect(loop.fadeCalls).toHaveLength(1)
    expect(loop.stopCalls).toEqual([])

    vi.advanceTimersByTime(LOOPING_SFX_FADE_OUT_MS)
    expect(loop.stopCalls).toEqual([1])
  })

  it("cancels a pending fade-out when a loop key starts again", async () => {
    const { startLoopingSfx, stopLoopingSfx } = await loadSoundEngine()

    startLoopingSfx("ramp_rolling", "ball-1")
    stopLoopingSfx("ramp_rolling", "ball-1")

    const loop = latestHowl()
    expect(loop.fadeCalls).toHaveLength(1)

    vi.advanceTimersByTime(LOOPING_SFX_FADE_OUT_MS - 1)
    startLoopingSfx("ramp_rolling", "ball-2")
    vi.advanceTimersByTime(1)

    expect(loop.playCalls).toBe(1)
    expect(loop.stopCalls).toEqual([])
    expect(loop.volume()).toBe(0.4)
  })

  it("applies mute and volume changes to active loops", async () => {
    const { setSfxEnabled, setSfxVolume, startLoopingSfx } = await loadSoundEngine()

    setSfxVolume(0.5)
    startLoopingSfx("ramp_rolling", "ball-1")

    const loop = latestHowl()
    expect(loop.volume()).toBe(0.5)

    setSfxEnabled(false)
    expect(loop.stopCalls).toEqual([1])

    setSfxVolume(0.25)
    setSfxEnabled(true)

    expect(loop.playCalls).toBe(2)
    expect(loop.volume()).toBe(0.25)
  })
})
