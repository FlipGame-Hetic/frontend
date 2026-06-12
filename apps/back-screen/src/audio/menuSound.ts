function playOnce(path: string): void {
  const audio = new Audio(path)
  audio.play().catch(() => undefined)
}

export function playNavigationForward(): void {
  playOnce("/sounds/navigation_forward.wav")
}

export function playNavigationBackward(): void {
  playOnce("/sounds/navigation_backward.wav")
}
