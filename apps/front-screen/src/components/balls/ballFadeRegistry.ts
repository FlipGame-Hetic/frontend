const registry = new Map<string, () => void>()

export const registerBallFade = (id: string, cb: () => void) => {
  registry.set(id, cb)
}

export const unregisterBallFade = (id: string) => {
  registry.delete(id)
}

export const triggerBallFade = (id: string) => {
  registry.get(id)?.()
}
