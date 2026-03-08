// À déplacer dans @frontend/types quand le contrat serveur sera stabilisé

export type ConnectionStatus = "connecting" | "connected" | "disconnected"

/** Messages envoyés par le front-screen vers le serveur */
export type ClientMessage =
  | { type: "game:start" }
  | { type: "flipper:left" }
  | { type: "flipper:right" }
  | { type: "ball:plunger" }
  | { type: "ball:death" }
  | { type: "bumper:hit"; id: 1 | 2 | 3 }
  | { type: "player:ability" }
  | { type: "game:tilt" }
  | { type: "player:energy"; value: number }

/** Messages reçus du serveur par le front-screen */
export type ServerMessage =
  | { type: "game:state"; payload: unknown }
  | { type: "error"; message: string }
