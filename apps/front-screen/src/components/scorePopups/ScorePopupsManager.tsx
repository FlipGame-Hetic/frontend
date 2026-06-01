import { Text } from "@react-three/drei"
import useScorePopupsStore from "@/stores/useScorePopupsStore"
import ScorePopup from "./ScorePopup"
import { SCORE_POPUP_FONT, SCORE_POPUP_FONT_SIZE } from "./scorePopupConfig"

const ScorePopupsManager = () => {
  const popups = useScorePopupsStore((state) => state.popups)

  return (
    <>
      <Text
        font={SCORE_POPUP_FONT}
        fontSize={SCORE_POPUP_FONT_SIZE}
        position={[0, -9999, 0]}
        fillOpacity={0}
        outlineOpacity={0}
      >
        +0
      </Text>
      {popups.map((p) => (
        <ScorePopup key={p.id} id={p.id} amount={p.amount} position={p.position} />
      ))}
    </>
  )
}

export default ScorePopupsManager
