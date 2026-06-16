import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

interface MockHowlOptions {
  src: string[]
  volume: number
  onplay?: () => void
  onend?: () => void
}

interface MockHowlInstance {
  options: MockHowlOptions
  src: string[]
  play: () => number
  stop: () => void
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
    options: MockHowlOptions
    src: string[]
    private currentVolume: number

    constructor(options: MockHowlOptions) {
      this.options = options
      this.src = options.src
      this.currentVolume = options.volume
      howlInstances.push(this)
    }

    play() {
      this.options.onplay?.()
      return 1
    }

    stop() {
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
