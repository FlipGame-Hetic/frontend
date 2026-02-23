import type { GameState } from "./game";

export type ServerMessage =
  | { type: "GAME_STATE"; payload: GameState }
  | { type: "PLAYER_JOINED"; payload: { playerId: string } }
  | { type: "GAME_OVER"; payload: { winnerId: string } };

export type ClientMessage =
  | { type: "FLIP_LEFT" }
  | { type: "FLIP_RIGHT" }
  | { type: "USE_ABILITY"; payload: { abilityId: string } }
  | { type: "JOIN_ROOM"; payload: { roomCode: string } };
