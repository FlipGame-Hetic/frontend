import { useControls } from "leva"
import Ramp from "./Ramp"
import { LEFT_RAMP_POINTS, RAMP_DEFAULTS, RIGHT_RAMP_POINTS, type RampSettings } from "./rampConfig"

export default function RampsManager() {
  const settings = useControls("Ramp", {
    segmentCount: { value: RAMP_DEFAULTS.segmentCount, min: 16, max: 96, step: 1 },
    channelWidth: { value: RAMP_DEFAULTS.channelWidth, min: 0.55, max: 1.4, step: 0.01 },
    floorThickness: { value: RAMP_DEFAULTS.floorThickness, min: 0.05, max: 0.4, step: 0.01 },
    wallThickness: { value: RAMP_DEFAULTS.wallThickness, min: 0.05, max: 0.4, step: 0.01 },
    wallHeight: { value: RAMP_DEFAULTS.wallHeight, min: 0.2, max: 1.2, step: 0.01 },
    segmentOverlap: { value: RAMP_DEFAULTS.segmentOverlap, min: 0, max: 0.4, step: 0.01 },
    surfaceFriction: { value: RAMP_DEFAULTS.surfaceFriction, min: 0, max: 1, step: 0.01 },
    surfaceRestitution: { value: RAMP_DEFAULTS.surfaceRestitution, min: 0, max: 0.4, step: 0.01 },
    assistAcceleration: { value: RAMP_DEFAULTS.assistAcceleration, min: 0, max: 20, step: 0.1 },
    assistMaxSpeed: { value: RAMP_DEFAULTS.assistMaxSpeed, min: 4, max: 30, step: 0.25 },
    assistMaxT: { value: RAMP_DEFAULTS.assistMaxT, min: 0, max: 1, step: 0.01 },
    assistEntryRetention: {
      value: RAMP_DEFAULTS.assistEntryRetention,
      min: 0,
      max: 1.2,
      step: 0.01,
    },
  }) as RampSettings

  return (
    <>
      <Ramp key="ramp-left" points={LEFT_RAMP_POINTS} settings={settings} />
      <Ramp key="ramp-right" points={RIGHT_RAMP_POINTS} settings={settings} />
    </>
  )
}
