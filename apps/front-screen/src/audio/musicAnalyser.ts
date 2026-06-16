import { Howler } from "howler"

let analyser: AnalyserNode | null = null
let lastMusicNode: AudioNode | null = null

const ensureAnalyser = (): AnalyserNode | null => {
  if (analyser) return analyser
  const ctx = (Howler as unknown as { ctx?: AudioContext }).ctx
  if (!ctx) return null
  const node = ctx.createAnalyser()
  node.fftSize = 1024
  node.smoothingTimeConstant = 0.3
  analyser = node
  return node
}

export const connectMusicNode = (howl: Howl): void => {
  const node = ensureAnalyser()
  if (!node) return
  if (lastMusicNode) {
    try {
      lastMusicNode.disconnect(node)
    } catch {
      /* ignore */
    }
    lastMusicNode = null
  }
  try {
    const sounds = (howl as unknown as { _sounds: { _node: AudioNode }[] })._sounds
    const audioNode = sounds[0]?._node
    if (audioNode) {
      audioNode.connect(node)
      lastMusicNode = audioNode
    }
  } catch {
    /* ignore */
  }
}
