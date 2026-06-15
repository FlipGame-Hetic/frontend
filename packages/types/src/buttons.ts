export const BUTTON_IDS = {
  flipperLeft: "flipper_left",
  flipperRight: "flipper_right",
  start: "start",
  extra1: "extra_1",
  extra2: "extra_2",
} as const

export type ButtonId = (typeof BUTTON_IDS)[keyof typeof BUTTON_IDS]
