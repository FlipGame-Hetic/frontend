export interface GameState {
  ballPosition: { x: number; y: number; z: number };
  score: [number, number];
  currentPlayer: 1 | 2;
  phase: "waiting" | "playing" | "paused" | "ended";
}
