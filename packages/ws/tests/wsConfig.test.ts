import { afterEach, describe, expect, it, vi } from "vitest"
import { nextReconnectDelay, resolveGameWsUrl, resolveScreenHubUrl } from "../src/wsConfig"

const originalLocation = (globalThis as unknown as { location?: Location }).location

function setRuntimeLocation(protocol: "http:" | "https:", hostname: string, host = hostname): void {
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: { protocol, host, hostname },
  })
}

afterEach(() => {
  vi.restoreAllMocks()

  if (originalLocation) {
    Object.defineProperty(globalThis, "location", {
      configurable: true,
      value: originalLocation,
    })
    return
  }

  Reflect.deleteProperty(globalThis, "location")
})

describe("wsConfig", () => {
  it("backs off reconnect retries while keeping them capped at 3s", () => {
    const random = vi.spyOn(Math, "random")

    random.mockReturnValue(0)
    expect(nextReconnectDelay(0)).toBe(800)

    random.mockReturnValue(1)
    expect(nextReconnectDelay(0)).toBe(1000)

    random.mockReturnValue(0.5)
    expect(nextReconnectDelay(1)).toBe(1800)

    random.mockReturnValue(1)
    expect(nextReconnectDelay(10)).toBe(3000)
  })

  it("builds localhost fallback websocket URLs through the reverse proxy", () => {
    setRuntimeLocation("http:", "localhost")

    expect(resolveScreenHubUrl()).toBe("ws://localhost")
    expect(resolveGameWsUrl()).toBe("ws://localhost/ws/bridge")
  })

  it("does not inherit the frontend page port for localhost fallback websocket URLs", () => {
    setRuntimeLocation("http:", "localhost", "localhost:3000")

    expect(resolveScreenHubUrl()).toBe("ws://localhost")
    expect(resolveGameWsUrl()).toBe("ws://localhost/ws/bridge")
  })

  it("builds production fallback websocket URLs through the same host reverse proxy", () => {
    setRuntimeLocation("http:", "flipper.example.com")

    expect(resolveScreenHubUrl()).toBe("ws://flipper.example.com")
    expect(resolveGameWsUrl()).toBe("ws://flipper.example.com/ws/bridge")
  })

  it("uses secure websockets on https pages", () => {
    setRuntimeLocation("https:", "flipper.example.com")

    expect(resolveScreenHubUrl()).toBe("wss://flipper.example.com")
    expect(resolveGameWsUrl()).toBe("wss://flipper.example.com/ws/bridge")
  })

  it("keeps explicit overrides and ignores blank overrides", () => {
    setRuntimeLocation("http:", "flipper.local")

    expect(resolveScreenHubUrl(" ws://custom-host:9000 ")).toBe("ws://custom-host:9000")
    expect(resolveGameWsUrl(" ")).toBe("ws://flipper.local/ws/bridge")
  })
})
