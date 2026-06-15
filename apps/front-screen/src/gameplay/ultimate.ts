import { broadcastEvent } from "@frontend/ws"

export const triggerUltimate = (player: number): void => {
  // TODO: implémenter l'effet visuel/gameplay de l'ultimate côté front.
  broadcastEvent({ event_type: "ultimate_activated", payload: { player } })
}
