import { Text } from "@react-three/drei"
import useScorePopupsStore from "@/stores/useScorePopupsStore"
import ScorePopup from "./ScorePopup"
import {
  SCORE_POPUP_FONT,
  SCORE_POPUP_FONT_SIZE,
  SCORE_POPUP_LETTER_SPACING,
} from "./scorePopupConfig"

const ScorePopupsManager = () => {
  const popups = useScorePopupsStore((state) => state.popups)

  return (
    <>
      <Text
        font={SCORE_POPUP_FONT}
        fontSize={SCORE_POPUP_FONT_SIZE}
        letterSpacing={SCORE_POPUP_LETTER_SPACING}
        position={[0, -9999, 0]}
        fillOpacity={0}
        outlineOpacity={0}
      >
        +0
      </Text>
      {popups.map((p) => (
        <ScorePopup key={p.id} id={p.id} amount={p.amount} position={p.position} color={p.color} />
      ))}
    </>
  )
}

export default ScorePopupsManager
