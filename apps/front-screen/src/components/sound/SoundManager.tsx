import useGameStore from "@/stores/useGameStore"
import { useControls } from "leva"
import { useEffect, useRef } from "react"
import { MUSIC_DEFAULT_VOLUME, SFX_DEFAULT_VOLUME } from "@/audio/soundConfig"
import {
  playSfx,
  setMusicEnabled,
  setMusicVolume,
  setSfxEnabled,
  setSfxVolume,
  startMusic,
} from "@/audio/soundEngine"

const SoundManager = () => {
  const [sound, setSound] = useControls(
    "Sound",
    () => ({
      sfxMuted: { value: false, label: "Mute SFX" },
      sfxVolume: { value: SFX_DEFAULT_VOLUME, min: 0, max: 1, step: 0.05, label: "SFX volume" },
      musicMuted: { value: true, label: "Mute music" },
      musicVolume: {
        value: MUSIC_DEFAULT_VOLUME,
        min: 0,
        max: 1,
        step: 0.05,
        label: "Music volume",
      },
    }),
    { order: 3 },
  )

  const sfxMutedRef = useRef(sound.sfxMuted)
  const musicMutedRef = useRef(sound.musicMuted)

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
    startMusic()
  }, [])

  useEffect(() => {
    return useGameStore.subscribe((state, prev) => {
      if (state.phase === "game_over" && prev.phase !== "game_over") {
        playSfx("game_over")
      }
    })
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return
      const target = e.target as HTMLElement | null
      if (target?.isContentEditable || target?.closest("input, textarea, select")) return

      if (e.key.toLowerCase() === "l") {
        setSound({ sfxMuted: !sfxMutedRef.current })
      } else if (e.key.toLowerCase() === "m") {
        setSound({ musicMuted: !musicMutedRef.current })
      }
    }

    window.addEventListener("keydown", handler)
    return () => {
      window.removeEventListener("keydown", handler)
    }
  }, [setSound])

  return null
}

export default SoundManager
