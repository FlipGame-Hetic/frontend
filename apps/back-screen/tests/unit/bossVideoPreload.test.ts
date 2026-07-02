import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { BOSS_REGISTRY } from "@/boss/bossConfig"

// module-level warmed flag persists, so reset modules between tests
async function loadModule() {
  vi.resetModules()
  return import("@/boss/bossVideoPreload")
}

function collectUniqueUrls(): string[] {
  const urls = new Set<string>()
  for (const def of BOSS_REGISTRY) {
    if (!def.clips) continue
    for (const u of def.clips.idle) urls.add(u)
    for (const u of def.clips.damage) urls.add(u)
    if (def.clips.death) urls.add(def.clips.death)
  }
  return [...urls]
}

function firstClipUrl(): string {
  const url = collectUniqueUrls()[0]
  if (url === undefined) {
    throw new Error("Expected at least one boss clip URL")
  }
  return url
}

function createFetchMock(response: Response) {
  return vi.fn<typeof fetch>(() => Promise.resolve(response))
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe("bossVideoPreload", () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    // jsdom lacks blob URL support, stub the object URL factory
    vi.stubGlobal(
      "URL",
      Object.assign(URL, {
        createObjectURL: vi.fn((blob: Blob) => `blob:${(blob as { id?: string }).id ?? "x"}`),
      }),
    )
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("returns the input url unchanged before warming", async () => {
    const { resolveWarmClipUrl } = await loadModule()
    const url = firstClipUrl()
    expect(resolveWarmClipUrl(url)).toBe(url)
  })

  it("fetches each unique clip url exactly once (dedup across registry)", async () => {
    const fetchMock = createFetchMock(new Response(new Blob(), { status: 200 }))
    global.fetch = fetchMock as unknown as typeof fetch

    const { warmBossClips } = await loadModule()
    warmBossClips()
    warmBossClips() // second call is a no-op
    await flush()

    const unique = collectUniqueUrls()
    expect(fetchMock).toHaveBeenCalledTimes(unique.length)
    const requested = fetchMock.mock.calls.map((c) => c[0])
    for (const url of unique) expect(requested).toContain(url)
  })

  it("resolves to a blob url after warming succeeds", async () => {
    let counter = 0
    const fetchMock = vi.fn<typeof fetch>(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve({ id: String(counter++) } as unknown as Blob),
      } as Response),
    )
    global.fetch = fetchMock as unknown as typeof fetch

    const { warmBossClips, resolveWarmClipUrl } = await loadModule()
    warmBossClips()
    await flush()

    const url = firstClipUrl()
    expect(resolveWarmClipUrl(url)).toMatch(/^blob:/)
  })

  it("falls back to the network url when fetch fails", async () => {
    const fetchMock = createFetchMock(new Response(null, { status: 500 }))
    global.fetch = fetchMock as unknown as typeof fetch

    const { warmBossClips, resolveWarmClipUrl } = await loadModule()
    warmBossClips()
    await flush()

    const url = firstClipUrl()
    expect(resolveWarmClipUrl(url)).toBe(url)
  })
})
