import { BOSS_REGISTRY } from "./bossConfig"

const warmUrls = new Map<string, string>()
let warmed = false

export function warmBossClips(): void {
  if (warmed) return
  warmed = true
  const urls = new Set<string>()
  for (const def of BOSS_REGISTRY) {
    if (!def.clips) continue
    for (const u of def.clips.idle) urls.add(u)
    for (const u of def.clips.damage) urls.add(u)
    if (def.clips.death) urls.add(def.clips.death)
  }
  for (const url of urls) {
    void fetch(url)
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error(String(res.status)))))
      .then((blob) => warmUrls.set(url, URL.createObjectURL(blob)))
      .catch(() => undefined) // fall back to the network URL at boss start
  }
}

export function resolveWarmClipUrl(url: string): string {
  return warmUrls.get(url) ?? url
}
