export const SFX_DEFAULT_VOLUME = 0.4
export const MUSIC_DEFAULT_VOLUME = 1.5
export const LOOPING_SFX_FADE_OUT_MS = 220

const base = import.meta.env.BASE_URL

export const SFX_GAINS: Record<string, number> = {
  flipper: 1.0,
  plunger: 2.0,
  ballsaver: 1.0,
  portal: 1.0,
  multiball: 1.0,
  bumpers: 1.0,
  targets: 1.0,
  slingshots: 1.0,
  ball: 1.0,
  score: 1.0,
  ultimates: 1.5,
}

const sfx = (dir: string, name: string): [string, string] => [
  `${base}sounds/${dir}/${name}.ogg`,
  `${base}sounds/${dir}/${name}.m4a`,
]

export const SFX_PATHS: Record<string, [string, string]> = {
  ball_new: sfx("ball", "new"),
  ramp_rolling: sfx("ball", "ramp_rolling"),
  ballsaver_up: sfx("ball_savers", "up"),
  plunger_launch: sfx("plunger", "launch"),
  flipper_up: sfx("flipperJoints", "up"),
  flipper_down: sfx("flipperJoints", "down"),
  game_over: sfx("score", "game_over"),
  ultimate_ready: sfx("ultimates", "ready"),
  ultimate_trigger: sfx("ultimates", "trigger"),
  multiball_triggered: sfx("multiball", "multiball"),
  hit0: sfx("multiball", "hit0"),
  hit1: sfx("multiball", "hit1"),
  hit2: sfx("multiball", "hit2"),
  hit3: sfx("multiball", "hit3"),
  hit4: sfx("multiball", "hit4"),
  hit5: sfx("multiball", "hit5"),
  hit6: sfx("multiball", "hit6"),
  hit7: sfx("multiball", "hit7"),
  hit8: sfx("multiball", "hit8"),
  hit9: sfx("multiball", "hit9"),
}

export const SFX_GROUPS: Record<string, [string, string][]> = {
  ball_lost: [sfx("ball", "lost1"), sfx("ball", "lost2")],
  portal_enter: [sfx("portal", "enter1"), sfx("portal", "enter2")],
  portal_exit: [sfx("portal", "exit1"), sfx("portal", "exit2")],
  bumpers: [sfx("bumpers", "0"), sfx("bumpers", "1"), sfx("bumpers", "2")],
  slingshots: [sfx("slingshots", "hit1"), sfx("slingshots", "hit2")],
  targets: [sfx("targets", "hit1"), sfx("targets", "hit2")],
}

export const MUSIC_TRACKS = [
  `${base}sounds/music/1.mp3`,
  `${base}sounds/music/2.mp3`,
  `${base}sounds/music/3.mp3`,
  `${base}sounds/music/4.mp3`,
  `${base}sounds/music/5.mp3`,
  `${base}sounds/music/6.mp3`,
  `${base}sounds/music/7.mp3`,
]
