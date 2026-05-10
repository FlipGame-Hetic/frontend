import Slingshot from "./Slingshot"
import { SLINGSHOT_CONFIGS } from "./slingshotConfig"

const SlingshotsManager = () => (
  <>
    {SLINGSHOT_CONFIGS.map((cfg, i) => (
      <Slingshot key={i} position={cfg.position} side={cfg.side} slingshotId={i} />
    ))}
  </>
)

export default SlingshotsManager
