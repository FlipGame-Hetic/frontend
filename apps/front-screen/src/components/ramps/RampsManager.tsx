import { useControls } from "leva"
import NativeRamp from "./NativeRamp"
import RailRamp from "./RailRamp"
import {
  LEFT_RAMP_POINTS,
  NATIVE_RAMP_DEFAULTS,
  RIGHT_RAMP_POINTS,
  type NativeRampSettings,
  type RampPhysicsMode,
} from "./rampConfig"

export default function RampsManager() {
  const { physicsMode } = useControls("Ramps", {
    physicsMode: {
      value: "rail" as RampPhysicsMode,
      options: { rail: "rail", native: "native" },
      label: "Physics mode",
    },
  })

  const nativeSettings = useControls("Native Ramp", {
    segmentCount: {
      value: NATIVE_RAMP_DEFAULTS.segmentCount,
      min: 16,
      max: 96,
      step: 1,
    },
    channelWidth: {
      value: NATIVE_RAMP_DEFAULTS.channelWidth,
      min: 0.55,
      max: 1.4,
      step: 0.01,
    },
    floorThickness: {
      value: NATIVE_RAMP_DEFAULTS.floorThickness,
      min: 0.05,
      max: 0.4,
      step: 0.01,
    },
    wallThickness: {
      value: NATIVE_RAMP_DEFAULTS.wallThickness,
      min: 0.05,
      max: 0.4,
      step: 0.01,
    },
    wallHeight: {
      value: NATIVE_RAMP_DEFAULTS.wallHeight,
      min: 0.2,
      max: 1.2,
      step: 0.01,
    },
    segmentOverlap: {
      value: NATIVE_RAMP_DEFAULTS.segmentOverlap,
      min: 0,
      max: 0.4,
      step: 0.01,
    },
    surfaceFriction: {
      value: NATIVE_RAMP_DEFAULTS.surfaceFriction,
      min: 0,
      max: 1,
      step: 0.01,
    },
    surfaceRestitution: {
      value: NATIVE_RAMP_DEFAULTS.surfaceRestitution,
      min: 0,
      max: 0.4,
      step: 0.01,
    },
    assistAcceleration: {
      value: NATIVE_RAMP_DEFAULTS.assistAcceleration,
      min: 0,
      max: 20,
      step: 0.1,
    },
    assistMaxSpeed: {
      value: NATIVE_RAMP_DEFAULTS.assistMaxSpeed,
      min: 4,
      max: 30,
      step: 0.25,
    },
    assistMaxT: {
      value: NATIVE_RAMP_DEFAULTS.assistMaxT,
      min: 0,
      max: 1,
      step: 0.01,
    },
    assistEntryRetention: {
      value: NATIVE_RAMP_DEFAULTS.assistEntryRetention,
      min: 0,
      max: 1.2,
      step: 0.01,
    },
  }) as NativeRampSettings

  if (physicsMode === "native") {
    return (
      <>
        <NativeRamp key="native-left" points={LEFT_RAMP_POINTS} settings={nativeSettings} />
        <NativeRamp key="native-right" points={RIGHT_RAMP_POINTS} settings={nativeSettings} />
      </>
    )
  }

  return (
    <>
      <RailRamp key="rail-left" points={LEFT_RAMP_POINTS} />
      <RailRamp key="rail-right" points={RIGHT_RAMP_POINTS} />
    </>
  )
}
