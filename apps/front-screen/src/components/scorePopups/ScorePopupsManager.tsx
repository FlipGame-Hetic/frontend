import { Text } from "@react-three/drei"
import useScorePopupsStore from "@/stores/useScorePopupsStore"
import MultiballPopup from "./popups/MultiballPopup"
import ScorePopup from "./popups/ScorePopup"
import PopupTextStack from "./text/PopupTextStack"
import {
  SCORE_POPUP_DURATION,
  SCORE_POPUP_FADE_OUT_START,
  SCORE_POPUP_FONT,
  SCORE_POPUP_FONT_SIZE,
  SCORE_POPUP_LETTER_SPACING,
  SCORE_POPUP_RISE_HEIGHT,
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
      {popups.map((p) => {
        if (p.kind === "score") {
          return (
            <ScorePopup
              key={p.id}
              id={p.id}
              amount={p.amount ?? 0}
              position={p.position}
              color={p.color}
            />
          )
        }

        if (p.kind === "multiball-trigger") {
          return (
            <MultiballPopup
              key={p.id}
              id={p.id}
              position={p.position}
              color={p.color}
              text={p.text ?? "MULTIBALL"}
            />
          )
        }

        return (
          <PopupTextStack
            key={p.id}
            id={p.id}
            color={p.color}
            duration={SCORE_POPUP_DURATION}
            fadeOutStart={SCORE_POPUP_FADE_OUT_START}
            fillOpacity={1}
            position={p.position}
            riseHeight={SCORE_POPUP_RISE_HEIGHT}
            shouldGlitch={false}
            text={p.text ?? ""}
          />
        )
      })}
    </>
  )
}

export default ScorePopupsManager
