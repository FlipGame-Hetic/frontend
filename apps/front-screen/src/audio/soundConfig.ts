export const SFX_DEFAULT_VOLUME = 0.8
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
}

export const SFX_GROUPS: Record<string, string[]> = {
  bumpers: [
    `${base}sounds/bumpers/0.m4a`,
    `${base}sounds/bumpers/1.m4a`,
    `${base}sounds/bumpers/2.m4a`,
    `${base}sounds/bumpers/3.m4a`,
  ],
  slingshots: [`${base}sounds/slingshots/hit1.m4a`, `${base}sounds/slingshots/hit2.m4a`],
  targets: [`${base}sounds/targets/hit1.m4a`, `${base}sounds/targets/hit2.m4a`],
}

export const MUSIC_TRACKS = [`${base}sounds/music/1.mp3`, `${base}sounds/music/2.mp3`]
