import useGameStore from "@/stores/useGameStore"
import { GAME_PHASE } from "@frontend/types"
import { useControls } from "leva"
import { useEffect, useRef } from "react"
import { MUSIC_DEFAULT_VOLUME, MUSIC_TRACKS, SFX_DEFAULT_VOLUME } from "@/audio/soundConfig"
import {
  getCurrentTrackIndex,
  onMusicChange,
  playSfx,
  setMusicEnabled,
  setMusicTrack,
  setMusicVolume,
  setSfxEnabled,
  setSfxVolume,
  startMusic,
} from "@/audio/soundEngine"
import useKeyBinding from "@/hooks/useKeyBinding"

const MUSIC_TRACK_OPTIONS = Object.fromEntries(
  MUSIC_TRACKS.map((_, index) => [`Track ${String(index + 1)}`, index]),
) as Record<string, number>

interface LevaTrackChangeContext {
  initial: boolean
  fromPanel?: boolean
}

const SoundManager = () => {
  const engineIndexRef = useRef(-1)
  const hasStartedMusicRef = useRef(false)

  const [sound, setSound] = useControls(
    "Sound",
    () => ({
      sfxMuted: { value: false, label: "Mute SFX" },
      sfxVolume: { value: SFX_DEFAULT_VOLUME, min: 0, max: 1, step: 0.05, label: "SFX volume" },
      musicMuted: { value: false, label: "Mute music" },
      musicVolume: {
        value: MUSIC_DEFAULT_VOLUME,
        min: 0,
        max: 1,
        step: 0.05,
        label: "Music volume",
      },
      track: {
        value: 0 as number,
        options: MUSIC_TRACK_OPTIONS,
        transient: false,
        onChange: (value: number, _path: string, context: LevaTrackChangeContext) => {
          if (context.initial || !context.fromPanel) return
          if (value !== engineIndexRef.current) setMusicTrack(value)
        },
        label: "Current track",
      },
    }),
    { order: 3 },
  )

  const sfxMutedRef = useRef(sound.sfxMuted)
  const musicMutedRef = useRef(sound.musicMuted)

  useKeyBinding(
    "l",
    () => {
      setSound({ sfxMuted: !sfxMutedRef.current })
    },
    { match: "key" },
  )

  useKeyBinding(
    "m",
    () => {
      setSound({ musicMuted: !musicMutedRef.current })
    },
    { match: "key" },
  )

  useEffect(() => {
    sfxMutedRef.current = sound.sfxMuted
  }, [sound.sfxMuted])

  useEffect(() => {
    musicMutedRef.current = sound.musicMuted
  }, [sound.musicMuted])

  useEffect(() => {
    setSfxEnabled(!sound.sfxMuted)
  }, [sound.sfxMuted])

  useEffect(() => {
    setSfxVolume(sound.sfxVolume)
  }, [sound.sfxVolume])

  useEffect(() => {
    setMusicEnabled(!sound.musicMuted)
  }, [sound.musicMuted])

  useEffect(() => {
    setMusicVolume(sound.musicVolume)
  }, [sound.musicVolume])

  useEffect(() => {
    const unsub = onMusicChange((i) => {
      engineIndexRef.current = i
      setSound({ track: i })
    })
    const initial = getCurrentTrackIndex()
    if (initial >= 0) {
      engineIndexRef.current = initial
      setSound({ track: initial })
    }
    return unsub
  }, [setSound])

  useEffect(() => {
    const startWhenPlaying = (phase: ReturnType<typeof useGameStore.getState>["phase"]) => {
      if (hasStartedMusicRef.current || phase !== GAME_PHASE.Playing) return
      hasStartedMusicRef.current = true
      startMusic()
    }

    startWhenPlaying(useGameStore.getState().phase)
    return useGameStore.subscribe((state, prev) => {
      if (state.phase !== prev.phase) startWhenPlaying(state.phase)
    })
  }, [])

  useEffect(() => {
    return useGameStore.subscribe((state, prev) => {
      if (state.phase === GAME_PHASE.GameOver && prev.phase !== GAME_PHASE.GameOver) {
        playSfx("game_over")
      }
    })
  }, [])

  return null
}

export default SoundManager
