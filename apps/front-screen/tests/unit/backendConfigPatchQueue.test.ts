import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { BackendConfigPatchQueue } from "@/debug/backendConfigPatchQueue"
import { shouldPatchBackendConfigChange, toBackendConfigPatch } from "@/debug/backendConfigLeva"
import { BACKEND_CONFIG_FIELDS } from "@/debug/backendConfigCatalog"
import type { BackendConfigPatch } from "@/debug/backendConfigTypes"

const deferred = (): { promise: Promise<void>; resolve: () => void } => {
  let resolvePromise: (() => void) | undefined
  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve
  })

  return {
    promise,
    resolve: () => {
      if (!resolvePromise) throw new Error("Deferred promise was not initialized")
      resolvePromise()
    },
  }
}

describe("BackendConfigPatchQueue", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("debounces and merges nearby edits", async () => {
    const sent: BackendConfigPatch[] = []
    const queue = new BackendConfigPatchQueue((patch) => {
      sent.push(patch)
      return Promise.resolve()
    }, 100)

    queue.enqueue({ default_lives: 4 })
    queue.enqueue({ bumper_score: 250 })

    await vi.advanceTimersByTimeAsync(99)
    expect(sent).toEqual([])

    await vi.advanceTimersByTimeAsync(1)
    expect(sent).toEqual([{ default_lives: 4, bumper_score: 250 }])
  })

  it("sends edits made during an in-flight request afterwards", async () => {
    const firstRequest = deferred()
    const sent: BackendConfigPatch[] = []
    const queue = new BackendConfigPatchQueue(async (patch) => {
      sent.push(patch)
      if (sent.length === 1) await firstRequest.promise
    }, 10)

    queue.enqueue({ default_lives: 4 })
    await vi.advanceTimersByTimeAsync(10)
    expect(sent).toEqual([{ default_lives: 4 }])

    queue.enqueue({ bumper_score: 250 })
    await vi.advanceTimersByTimeAsync(10)
    expect(sent).toEqual([{ default_lives: 4 }])

    firstRequest.resolve()
    await Promise.resolve()
    await vi.runOnlyPendingTimersAsync()

    expect(sent).toEqual([{ default_lives: 4 }, { bumper_score: 250 }])
  })

  it("reports send failures without retrying the failed patch forever", async () => {
    const error = new Error("backend rejected patch")
    const onError = vi.fn()
    const queue = new BackendConfigPatchQueue(() => Promise.reject(error), 10, onError)

    queue.enqueue({ default_lives: 4 })
    await vi.advanceTimersByTimeAsync(10)

    expect(onError).toHaveBeenCalledWith(error)
    await vi.runOnlyPendingTimersAsync()
    expect(onError).toHaveBeenCalledTimes(1)
  })
})

describe("backend config Leva helpers", () => {
  it("ignores initial and programmatic changes", () => {
    expect(shouldPatchBackendConfigChange({ initial: true })).toBe(false)
    expect(shouldPatchBackendConfigChange({ fromPanel: false })).toBe(false)
    expect(shouldPatchBackendConfigChange({})).toBe(false)
    expect(shouldPatchBackendConfigChange({ fromPanel: true })).toBe(true)
  })

  it("normalizes integer fields before PATCH", () => {
    const field = BACKEND_CONFIG_FIELDS.find((entry) => entry.key === "default_lives")

    if (!field) throw new Error("default_lives field is missing")

    expect(toBackendConfigPatch(field, 4.9)).toEqual({ default_lives: 4 })
  })
})
