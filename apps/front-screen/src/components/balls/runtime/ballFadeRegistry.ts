// Lets the drain start a ball's fade-out without a re-render : the ball registers a callback here, the drain triggers it on contact
const registry = new Map<string, () => void>()

export const registerBallFade = (id: string, cb: () => void) => {
  registry.set(id, cb)
}

export const unregisterBallFade = (id: string) => {
  registry.delete(id)
}

export const triggerBallFade = (id: string) => {
  // Calls the passed id's callback (triggered by the drain)
  registry.get(id)?.()
}
