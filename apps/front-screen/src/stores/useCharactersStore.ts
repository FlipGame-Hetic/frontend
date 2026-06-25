import { create } from "zustand"
import { GAMEPLAY_FALLBACK } from "@frontend/types"
import { fetchCharacters, type CharactersBySlug } from "@/gameplay/characters"

interface CharactersStore {
  bySlug: CharactersBySlug
  loaded: boolean
  load: () => Promise<void>
}

const useCharactersStore = create<CharactersStore>()((set, get) => ({
  bySlug: { ...GAMEPLAY_FALLBACK },
  loaded: false,
  load: async () => {
    if (get().loaded) return
    const bySlug = await fetchCharacters()
    set({ bySlug, loaded: true })
  },
}))

export default useCharactersStore
