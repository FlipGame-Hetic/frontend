import { describe, expect, it } from "vitest"
import { getRuntimeEnvironmentFlags } from "@/config/runtimeEnvironment"

describe("runtimeEnvironment", () => {
  it("treats local as non-production browser runtime", () => {
    expect(getRuntimeEnvironmentFlags("local")).toEqual({
      environment: "local",
      isProduction: false,
      isProductionBrowser: false,
      isProductionCabinet: false,
    })
  })

  it("separates production browser from cabinet-only runtime", () => {
    expect(getRuntimeEnvironmentFlags("production-browser")).toEqual({
      environment: "production-browser",
      isProduction: true,
      isProductionBrowser: true,
      isProductionCabinet: false,
    })
  })

  it("treats production-cabinet and legacy production as cabinet runtimes", () => {
    expect(getRuntimeEnvironmentFlags("production-cabinet").isProductionCabinet).toBe(true)
    expect(getRuntimeEnvironmentFlags("production").isProductionCabinet).toBe(true)
  })
})
