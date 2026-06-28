import {
  AMBIENT_EVENT_BASE_DELAY_MS,
  AMBIENT_EVENT_DELAY_JITTER_MS,
  AMBIENT_EVENT_IDS,
  AMBIENT_EVENT_Z_JITTER,
  AMBIENT_EVENTS,
  type AmbientEventId,
  type AmbientEventInstance,
  type Waypoint,
} from "./ambientEventsConfig"

type Rng = () => number

const pickFrom = <T>(items: readonly T[], rng: Rng): T => {
  const item = items[Math.floor(rng() * items.length)]
  if (item === undefined) throw new Error("pickFrom called on an empty collection")
  return item
}

export const computeNextDelayMs = (rng: Rng = Math.random): number =>
  AMBIENT_EVENT_BASE_DELAY_MS + rng() * AMBIENT_EVENT_DELAY_JITTER_MS

// Avoids replaying the same event back-to-back for variety ; repeats over a whole game are fine
export const pickNextEventId = (
  previousId: AmbientEventId | null,
  rng: Rng = Math.random,
): AmbientEventId => {
  const candidates = AMBIENT_EVENT_IDS.filter((id) => id !== previousId)
  return pickFrom(candidates.length > 0 ? candidates : AMBIENT_EVENT_IDS, rng)
}

export const pickRoute = (
  routes: Record<string, readonly Waypoint[]>,
  rng: Rng = Math.random,
): Waypoint[] => pickFrom(Object.values(routes), rng).map(([x, y, z]) => [x, y, z] as Waypoint)

// Same Z offset on every waypoint so the whole lane shifts in depth without deforming the path
export const applyZJitter = (
  waypoints: readonly Waypoint[],
  rng: Rng = Math.random,
): Waypoint[] => {
  const dz = (rng() * 2 - 1) * AMBIENT_EVENT_Z_JITTER
  return waypoints.map(([x, y, z]) => [x, y, z + dz] as Waypoint)
}

export const buildEventInstanceFor = (
  id: AmbientEventId,
  rng: Rng = Math.random,
): AmbientEventInstance => {
  const def = AMBIENT_EVENTS[id]
  return { id, def, waypoints: applyZJitter(pickRoute(def.routes, rng), rng) }
}

export const buildEventInstance = (
  previousId: AmbientEventId | null,
  rng: Rng = Math.random,
): AmbientEventInstance => buildEventInstanceFor(pickNextEventId(previousId, rng), rng)
