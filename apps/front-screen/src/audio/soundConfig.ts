export const SFX_DEFAULT_VOLUME = 0.4
export const MUSIC_DEFAULT_VOLUME = 0.4

const base = import.meta.env.BASE_URL

export const SFX_PATHS: Record<string, string> = {
  ball_new: `${base}sounds/ball/new.wav`,
  ball_lost: `${base}sounds/ball/lost.wav`,
  ballsaver_up: `${base}sounds/ball_savers/up.wav`,
  plunger_launch: `${base}sounds/plunger/launch.m4a`,
  flipper_up: `${base}sounds/flipperJoints/up.m4a`,
  flipper_down: `${base}sounds/flipperJoints/down.m4a`,
  game_over: `${base}sounds/score/game_over.m4a`,
  zone_bounce: `${base}sounds/multiball/zone_enter.m4a`,
  multiball_triggered: `${base}sounds/multiball/multiball.m4a`,
  hit0: `${base}sounds/multiball/hit0.m4a`,
  hit1: `${base}sounds/multiball/hit1.m4a`,
  hit2: `${base}sounds/multiball/hit2.m4a`,
  hit3: `${base}sounds/multiball/hit3.m4a`,
  hit4: `${base}sounds/multiball/hit4.m4a`,
  hit5: `${base}sounds/multiball/hit5.m4a`,
  hit6: `${base}sounds/multiball/hit6.m4a`,
  hit7: `${base}sounds/multiball/hit7.m4a`,
  hit8: `${base}sounds/multiball/hit8.m4a`,
  hit9: `${base}sounds/multiball/hit9.m4a`,
}

export const SFX_GROUPS: Record<string, string[]> = {
  portal_enter: [`${base}sounds/portal/enter1.wav`, `${base}sounds/portal/enter2.wav`],
  portal_exit: [`${base}sounds/portal/exit1.wav`, `${base}sounds/portal/exit2.wav`],
  bumpers: [
    `${base}sounds/bumpers/0.m4a`,
    `${base}sounds/bumpers/1.m4a`,
    `${base}sounds/bumpers/2.m4a`,
    `${base}sounds/bumpers/3.m4a`,
  ],
  slingshots: [`${base}sounds/slingshots/hit1.m4a`, `${base}sounds/slingshots/hit2.m4a`],
  targets: [`${base}sounds/targets/hit1.m4a`, `${base}sounds/targets/hit2.m4a`],
}

export const MUSIC_TRACKS = [
  `${base}sounds/music/1.mp3`,
  `${base}sounds/music/2.mp3`,
  `${base}sounds/music/3.mp3`,
]
