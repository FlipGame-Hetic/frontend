export function mockSend(type: string, payload: unknown): void {
  console.warn("[WS MOCK]", { type, payload })
}
