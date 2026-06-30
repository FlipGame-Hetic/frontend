import { ControlHint } from "./controls/ControlHint"
import { MENU_CONTROLS } from "./controls/controlsConfig"

export function MenuControlsLegend() {
  return (
    <>
      <div className="absolute bottom-10 left-12 z-20 flex flex-col gap-3">
        <ControlHint control={MENU_CONTROLS.back} side="left" />
        <ControlHint control={MENU_CONTROLS.navigateLeft} side="left" />
      </div>

      <div className="absolute right-12 bottom-10 z-20 flex flex-col gap-3">
        <ControlHint control={MENU_CONTROLS.confirm} side="right" />
        <ControlHint control={MENU_CONTROLS.navigateRight} side="right" />
      </div>
    </>
  )
}
