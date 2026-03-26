import Bumper from "./Bumper"
import { BUMPER_POSITIONS } from "./bumperConfig"

const BumpersManager = () => {
  return (
    <>
      {BUMPER_POSITIONS.map((position, i) => (
        <Bumper key={i} position={position} />
      ))}
    </>
  )
}

export default BumpersManager
