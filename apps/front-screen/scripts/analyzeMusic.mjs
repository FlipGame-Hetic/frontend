// Analyse offline des musiques -> base éditable de segments (musicSegments.generated.ts).
// Lance: `node scripts/analyzeMusic.mjs` depuis apps/front-screen.
// Sortie volontairement imparfaite : base de départ à ajuster à la main.

import { spawnSync } from "node:child_process"
import { writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const MUSIC_DIR = join(__dirname, "../public/sounds/music")
const OUT_FILE = join(__dirname, "../src/audio/musicSegments.generated.ts")

const TRACK_FILES = ["1.mp3", "2.mp3", "3.mp3", "4.mp3", "5.mp3", "6.mp3", "7.mp3"]

const SAMPLE_RATE = 22050
const WINDOW_SEC = 0.25
const FFT_SIZE = 1024
const FFT_HOP = 512

// Palette S.P.A.M.E.R (cyan / magenta / violet / rose). On la fait tourner aux frontières.
const PALETTE = ["#00f0ff", "#b026ff", "#ff2d6b", "#8000ff", "#00ffa3"]

// Seuils de classification : relatifs par piste (percentiles de l'enveloppe d'énergie),
// pour garder un contraste calm/build/drop même sur les morceaux très compressés.
const CALM_PERCENTILE = 0.45
const DROP_PERCENTILE = 0.78
const MIN_THRESHOLD_GAP = 0.08
const BUILD_SLOPE = 0.12 // hausse d'énergie sur la durée du segment
const MIN_SEGMENT_SEC = 3.5 // longueur mini d'un segment macro
const ENVELOPE_SMOOTH = 8 // fenêtres de lissage de l'enveloppe macro

// Subdivision des phases haute intensité (type "drop") en mini-segments couleur (effet explosif).
const SUBDIV_INTERVAL_SEC = 0.8
const SUBDIV_MIN_PARENT_SEC = 1.8

const decodePcm = (filePath) => {
  const res = spawnSync(
    "ffmpeg",
    ["-v", "quiet", "-i", filePath, "-ac", "1", "-ar", String(SAMPLE_RATE), "-f", "f32le", "-"],
    { maxBuffer: 1 << 30 },
  )
  if (res.status !== 0 || !res.stdout) throw new Error(`ffmpeg failed for ${filePath}`)
  const buf = res.stdout
  return new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 4))
}

// FFT itérative radix-2 in-place.
const fft = (re, im) => {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      const tr = re[i]
      re[i] = re[j]
      re[j] = tr
      const ti = im[i]
      im[i] = im[j]
      im[j] = ti
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len
    const wr = Math.cos(ang)
    const wi = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let cr = 1
      let ci = 0
      for (let k = 0; k < len >> 1; k++) {
        const a = i + k
        const b = a + (len >> 1)
        const xr = re[b] * cr - im[b] * ci
        const xi = re[b] * ci + im[b] * cr
        re[b] = re[a] - xr
        im[b] = im[a] - xi
        re[a] += xr
        im[a] += xi
        const ncr = cr * wr - ci * wi
        ci = cr * wi + ci * wr
        cr = ncr
      }
    }
  }
}

// RMS par fenêtre + flux spectral (agrégé par fenêtre) à partir de frames FFT.
const analyzeTrack = (samples) => {
  const duration = samples.length / SAMPLE_RATE
  const winLen = Math.floor(WINDOW_SEC * SAMPLE_RATE)
  const winCount = Math.max(1, Math.floor(samples.length / winLen))

  const rms = new Float32Array(winCount)
  for (let w = 0; w < winCount; w++) {
    let sum = 0
    const start = w * winLen
    for (let i = 0; i < winLen; i++) {
      const s = samples[start + i] ?? 0
      sum += s * s
    }
    rms[w] = Math.sqrt(sum / winLen)
  }

  const flux = new Float32Array(winCount)
  const fluxCount = new Float32Array(winCount)
  const re = new Float64Array(FFT_SIZE)
  const im = new Float64Array(FFT_SIZE)
  let prevMag = null
  for (let pos = 0; pos + FFT_SIZE <= samples.length; pos += FFT_HOP) {
    for (let i = 0; i < FFT_SIZE; i++) {
      const hann = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1))
      re[i] = (samples[pos + i] ?? 0) * hann
      im[i] = 0
    }
    fft(re, im)
    const half = FFT_SIZE >> 1
    const mag = new Float64Array(half)
    for (let i = 0; i < half; i++) mag[i] = Math.hypot(re[i], im[i])
    if (prevMag) {
      let f = 0
      for (let i = 0; i < half; i++) {
        const d = mag[i] - prevMag[i]
        if (d > 0) f += d
      }
      const center = (pos + FFT_SIZE / 2) / SAMPLE_RATE
      const w = Math.min(winCount - 1, Math.floor(center / WINDOW_SEC))
      flux[w] += f
      fluxCount[w] += 1
    }
    prevMag = mag
  }
  for (let w = 0; w < winCount; w++) {
    if (fluxCount[w] > 0) flux[w] /= fluxCount[w]
  }

  return { duration, rms, flux }
}

const normalize = (arr) => {
  let max = 0
  for (const v of arr) if (v > max) max = v
  if (max <= 0) return new Float32Array(arr.length)
  const out = new Float32Array(arr.length)
  for (let i = 0; i < arr.length; i++) out[i] = arr[i] / max
  return out
}

const smooth = (arr, radius) => {
  const out = new Float32Array(arr.length)
  for (let i = 0; i < arr.length; i++) {
    let sum = 0
    let count = 0
    for (let k = -radius; k <= radius; k++) {
      const j = i + k
      if (j < 0 || j >= arr.length) continue
      sum += arr[j]
      count++
    }
    out[i] = sum / count
  }
  return out
}

const round = (v, d = 3) => Number(v.toFixed(d))

const percentile = (arr, p) => {
  const sorted = Array.from(arr).sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))))
  return sorted[idx]
}

const segmentTrack = ({ duration, rms, flux }) => {
  const energy = smooth(normalize(rms), ENVELOPE_SMOOTH)
  const fluxN = normalize(flux)

  const calmMax = percentile(energy, CALM_PERCENTILE)
  const dropMin = Math.max(percentile(energy, DROP_PERCENTILE), calmMax + MIN_THRESHOLD_GAP)

  // Frontières : changement de niveau (calm/mid/high) ou pic de flux fort.
  const levelOf = (e) => (e < calmMax ? 0 : e < dropMin ? 1 : 2)
  const boundaries = [0]
  for (let i = 1; i < energy.length; i++) {
    const levelChange = levelOf(energy[i]) !== levelOf(energy[i - 1])
    const fluxSpike = fluxN[i] > 0.6 && fluxN[i] - fluxN[i - 1] > 0.25
    if (levelChange || fluxSpike) boundaries.push(i)
  }
  boundaries.push(energy.length)

  // Fusion des segments trop courts.
  const minWins = Math.max(1, Math.round(MIN_SEGMENT_SEC / WINDOW_SEC))
  const merged = [0]
  for (let b = 1; b < boundaries.length - 1; b++) {
    if (boundaries[b] - merged[merged.length - 1] >= minWins) merged.push(boundaries[b])
  }
  merged.push(energy.length)

  const macro = []
  let colorIdx = 0
  for (let s = 0; s < merged.length - 1; s++) {
    const start = merged[s]
    const end = merged[s + 1]
    let sum = 0
    for (let i = start; i < end; i++) sum += energy[i]
    const mean = sum / (end - start)
    const slope = energy[end - 1] - energy[start]

    let type = "calm"
    if (mean >= dropMin) type = "drop"
    else if (slope >= BUILD_SLOPE) type = "build"
    else if (mean >= calmMax) type = "build"

    // Gros saut de couleur sur un drop, sinon rotation simple.
    colorIdx = (colorIdx + (type === "drop" ? 2 : 1)) % PALETTE.length
    macro.push({
      time: round(start * WINDOW_SEC),
      intensity: round(Math.min(1, Math.max(0.12, mean))),
      color: PALETTE[colorIdx],
      type,
      _colorIdx: colorIdx,
      _durationSec: (end - start) * WINDOW_SEC,
    })
  }

  // Subdivision des phases haute intensité en mini-segments couleur.
  const segments = []
  for (const seg of macro) {
    const subdiv = seg.type === "drop" && seg._durationSec >= SUBDIV_MIN_PARENT_SEC
    if (!subdiv) {
      segments.push({ time: seg.time, intensity: seg.intensity, color: seg.color, type: seg.type })
      continue
    }
    const steps = Math.max(2, Math.floor(seg._durationSec / SUBDIV_INTERVAL_SEC))
    let ci = seg._colorIdx
    for (let k = 0; k < steps; k++) {
      ci = (ci + 1) % PALETTE.length
      segments.push({
        time: round(seg.time + k * (seg._durationSec / steps)),
        intensity: seg.intensity,
        color: PALETTE[ci],
        type: seg.type,
      })
    }
  }

  if (segments.length === 0 || segments[0].time > 0) {
    segments.unshift({ time: 0, intensity: 0.2, color: PALETTE[0], type: "calm" })
  }

  return { duration: round(duration, 2), segments }
}

const main = () => {
  const tracks = []
  for (const file of TRACK_FILES) {
    const path = join(MUSIC_DIR, file)
    process.stdout.write(`Analyse ${file}... `)
    const samples = decodePcm(path)
    const analysis = analyzeTrack(samples)
    const result = segmentTrack(analysis)
    tracks.push(result)
    console.log(`${result.segments.length} segments (${result.duration}s)`)
  }

  const body = tracks
    .map((t, i) => {
      const segs = t.segments
        .map(
          (s) =>
            `    { time: ${s.time}, intensity: ${s.intensity}, color: "${s.color}", type: "${s.type}" },`,
        )
        .join("\n")
      return `  // Track ${i + 1}\n  {\n    duration: ${t.duration},\n    segments: [\n${segs}\n    ],\n  },`
    })
    .join("\n")

  const out = `// AUTO-GÉNÉRÉ par scripts/analyzeMusic.mjs — base éditable, ajuster à la main.
import type { TrackSegments } from "./musicSegments"

export const GENERATED_TRACK_SEGMENTS: TrackSegments[] = [
${body}
]
`
  writeFileSync(OUT_FILE, out)
  console.log(`\nÉcrit ${OUT_FILE}`)
}

main()
