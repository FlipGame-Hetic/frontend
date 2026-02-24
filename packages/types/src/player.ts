export interface Player {
  id: string;
  name: string;
  character: CharacterType;
  hp: number;
  score: number;
}

export type CharacterType = "striker" | "defender" | "trickster" | "heavy";
