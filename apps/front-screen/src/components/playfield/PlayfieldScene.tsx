import BallSaversManager from "../ballSavers/BallSaversManager"
import BumpersManager from "../bumpers/BumpersManager"
import SlimBumpersManager from "../bumpers/SlimBumpersManager"
import AnimatedGroups from "./decorations/AnimatedGroups"
import FlippersManager from "../flippers/FlippersManager"
import MultiballGate from "../bonusZone/multiballGate/MultiballGate"
import PlungerManager from "../plunger/PlungerManager"
import SlingshotsManager from "../slingshots/SlingshotsManager"
import TargetsManager from "../targets/TargetsManager"
import StaticPlayfield from "./StaticPlayfield"
import { usePlayfieldModel } from "./usePlayfieldModel"
import { useEffect } from "react"
import usePlayfieldReadyStore from "@/stores/usePlayfieldReadyStore"

const PlayfieldScene = () => {
  const { nodes, animations } = usePlayfieldModel()

  useEffect(() => {
    usePlayfieldReadyStore.getState().setReady(true)
    return () => {
      usePlayfieldReadyStore.getState().setReady(false)
    }
  }, [])

  return (
    <>
      <StaticPlayfield nodes={nodes} />
      <AnimatedGroups nodes={nodes} animations={animations} />
      <MultiballGate nodes={nodes} />
      <BumpersManager nodes={nodes} />
      <SlimBumpersManager nodes={nodes} />
      <SlingshotsManager nodes={nodes} />
      <FlippersManager nodes={nodes} />
      <TargetsManager nodes={nodes} />
      <BallSaversManager nodes={nodes} />
      <PlungerManager nodes={nodes} />
    </>
  )
}

export default PlayfieldScene
