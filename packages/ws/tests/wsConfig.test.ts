import { afterEach, describe, expect, it } from "vitest"
import { resolveGameWsUrl, resolveScreenHubUrl } from "../src/wsConfig"

const originalLocation = (globalThis as unknown as { location?: Location }).location

function setRuntimeLocation(protocol: "http:" | "https:", hostname: string): void {
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: { protocol, hostname },
  })
}

afterEach(() => {
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
  it("builds localhost fallback websocket URLs on the backend dev port", () => {
    setRuntimeLocation("http:", "localhost")

    expect(resolveScreenHubUrl()).toBe("ws://localhost:8080")
    expect(resolveGameWsUrl()).toBe("ws://localhost:8080/ws/bridge")
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
