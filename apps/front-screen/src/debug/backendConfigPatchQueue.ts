import type { BackendConfigPatch } from "./backendConfigTypes"

export const BACKEND_CONFIG_PATCH_DEBOUNCE_MS = 350

type PatchSender = (patch: BackendConfigPatch) => Promise<unknown>
type PatchErrorHandler = (error: unknown) => void

const hasPatchValues = (patch: BackendConfigPatch): boolean => Object.keys(patch).length > 0

export class BackendConfigPatchQueue {
  private pendingPatch: BackendConfigPatch = {}
  private timer: ReturnType<typeof setTimeout> | undefined
  private sending = false

  constructor(
    private readonly sendPatch: PatchSender,
    private readonly debounceMs = BACKEND_CONFIG_PATCH_DEBOUNCE_MS,
    private readonly onError?: PatchErrorHandler,
  ) {}

  enqueue(patch: BackendConfigPatch): void {
    this.pendingPatch = { ...this.pendingPatch, ...patch }
    this.schedule(this.debounceMs)
  }

  cancel(): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
    this.pendingPatch = {}
  }

  private schedule(delayMs: number): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer)
    }

    this.timer = setTimeout(() => {
      this.timer = undefined
      void this.flush()
    }, delayMs)
  }

  private async flush(): Promise<void> {
    if (this.sending) return
    if (!hasPatchValues(this.pendingPatch)) return

    const patch = this.pendingPatch
    this.pendingPatch = {}
    this.sending = true

    try {
      await this.sendPatch(patch)
    } catch (error) {
      this.onError?.(error)
    } finally {
      this.sending = false

      if (hasPatchValues(this.pendingPatch)) {
        this.schedule(0)
      }
    }
  }
}
