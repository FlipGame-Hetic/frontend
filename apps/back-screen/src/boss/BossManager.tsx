import { useBackScreenStore } from "@/stores/useBackScreenStore"
import { resolveBoss } from "./bossConfig"
import BossVideoShader from "./renderers/BossVideoShader"

export default function BossManager() {
  const bossId = useBackScreenStore((s) => s.bossId)
  const def = resolveBoss(bossId)

  switch (def.renderer) {
    case "video-shader":
      return def.clips ? <BossVideoShader clips={def.clips} /> : null
    case "model":
      return null
  }
}
