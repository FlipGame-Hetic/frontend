function playOnce(path: string): void {
  const audio = new Audio(path)
  audio.play().catch(() => undefined)
}

export function playMenuForward(): void {
  playOnce("/sounds/menu_forward.wav")
}
