import { Howler } from "howler"

let installed = false

// Master limiter to avoid the cabinet's amplifiers saturation
export function installAudioLimiter(): void {
  if (installed) return
  // Typed non-null by howler but undefined until audio is initialized
  const ctx = Howler.ctx as AudioContext | undefined
  const master = Howler.masterGain as GainNode | undefined
  // Ctx not created yet, retries on next sound
  if (!ctx || !master) return

  const limiter = ctx.createDynamicsCompressor()
  limiter.threshold.value = -3
  limiter.ratio.value = 20
  limiter.attack.value = 0.003
  limiter.release.value = 0.25

  master.disconnect()
  master.connect(limiter)
  limiter.connect(ctx.destination)
  installed = true
}
