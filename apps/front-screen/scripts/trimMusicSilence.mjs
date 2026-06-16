// Trim leading/trailing silence from music tracks while keeping a small safety margin.
// Run from apps/front-screen with: `node scripts/trimMusicSilence.mjs`

import { spawnSync } from "node:child_process"
import { existsSync, renameSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const MUSIC_DIR = join(__dirname, "../public/sounds/music")
const TRACK_FILES = ["1.mp3", "2.mp3", "3.mp3", "4.mp3", "5.mp3", "6.mp3", "7.mp3"]

const SILENCE_NOISE_DB = "-45dB"
const SILENCE_DURATION_SEC = 0.12
const MIN_TRIM_SEC = 0.5
const LEADING_MARGIN_SEC = 0.15
const TRAILING_MARGIN_SEC = 0.25
const EDGE_EPSILON_SEC = 0.08

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { encoding: "utf8", ...options })
  if (result.status !== 0) {
    throw new Error(
      `${command} failed with exit code ${result.status ?? "unknown"}\n${result.stderr ?? ""}`,
    )
  }
  return result
}

const formatSec = (value) => Number(value.toFixed(6)).toString()

const getDuration = (filePath) => {
  const result = run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ])
  const duration = Number(result.stdout.trim())
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Could not read duration for ${filePath}`)
  }
  return duration
}

const detectSilences = (filePath) => {
  const result = run("ffmpeg", [
    "-hide_banner",
    "-nostats",
    "-i",
    filePath,
    "-af",
    `silencedetect=noise=${SILENCE_NOISE_DB}:d=${SILENCE_DURATION_SEC}`,
    "-f",
    "null",
    "-",
  ])

  const silences = []
  let pendingStart = null

  for (const line of result.stderr.split("\n")) {
    const startMatch = line.match(/silence_start:\s*([0-9.]+)/)
    if (startMatch?.[1]) {
      pendingStart = Number(startMatch[1])
      continue
    }

    const endMatch = line.match(/silence_end:\s*([0-9.]+)\s*\|\s*silence_duration:\s*([0-9.]+)/)
    if (endMatch?.[1] && endMatch[2] && pendingStart !== null) {
      silences.push({
        start: pendingStart,
        end: Number(endMatch[1]),
        duration: Number(endMatch[2]),
      })
      pendingStart = null
    }
  }

  return silences
}

const getTrimRange = (duration, silences) => {
  const leading = silences.find(
    (silence) => silence.start <= EDGE_EPSILON_SEC && silence.duration >= MIN_TRIM_SEC,
  )
  const trailing = [...silences]
    .reverse()
    .find(
      (silence) => duration - silence.end <= EDGE_EPSILON_SEC && silence.duration >= MIN_TRIM_SEC,
    )

  const start = leading ? Math.max(0, leading.end - LEADING_MARGIN_SEC) : 0
  const end = trailing ? Math.min(duration, trailing.start + TRAILING_MARGIN_SEC) : duration

  return {
    start,
    end,
    leadingTrim: start,
    trailingTrim: duration - end,
    shouldTrim: start > 0 || duration - end > 0,
  }
}

const trimTrack = (filePath, range) => {
  const tmpPath = `${filePath}.trimmed.tmp.mp3`
  const duration = range.end - range.start
  if (duration <= 0) throw new Error(`Invalid trim range for ${filePath}`)

  run("ffmpeg", [
    "-hide_banner",
    "-y",
    "-i",
    filePath,
    "-ss",
    formatSec(range.start),
    "-t",
    formatSec(duration),
    "-map",
    "0:a:0",
    "-codec:a",
    "libmp3lame",
    "-q:a",
    "2",
    tmpPath,
  ])

  if (!existsSync(tmpPath)) throw new Error(`Expected trimmed file to exist: ${tmpPath}`)
  renameSync(tmpPath, filePath)
}

const main = () => {
  for (const file of TRACK_FILES) {
    const filePath = join(MUSIC_DIR, file)
    const duration = getDuration(filePath)
    const silences = detectSilences(filePath)
    const range = getTrimRange(duration, silences)

    if (!range.shouldTrim) {
      console.log(`${file}: unchanged (${formatSec(duration)}s)`)
      continue
    }

    trimTrack(filePath, range)
    console.log(
      `${file}: trimmed start=${formatSec(range.leadingTrim)}s end=${formatSec(
        range.trailingTrim,
      )}s -> ${formatSec(range.end - range.start)}s`,
    )
  }
}

main()
