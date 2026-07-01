import { afterEach, describe, expect, it, vi } from "vitest"
import { fetchBackendConfig, patchBackendConfig } from "@/debug/backendAdminApi"
import type { BackendGameConfig } from "@/debug/backendConfigTypes"

const makeBackendConfig = (): BackendGameConfig => ({
  default_lives: 3,
  ultime_charge_ratio: 100,
  ball_saver_score: 300,
  bumper_score: 100,
  bumper_triangle_score: 150,
  portal_score: 200,
  multiball_ring_threshold: 10,
  multiball_score: 600,
  timer_bonus_seconds: 60,
  timer_bonus_score: 500,
  timer_bonus_multiplier: 1.5,
  tilt_penalty_1: -2000,
  tilt_penalty_2: -6000,
  boss_0_hp: 64000,
  boss_1_hp: 128000,
  boss_2_hp: 512000,
  boss_0_difficulty_scale: 1,
  boss_1_difficulty_scale: 1.6,
  boss_2_difficulty_scale: 2.4,
  endless_base_difficulty_scale: 2.4,
  endless_level_scale_exponent: 1.3,
  combo_buffer_max: 10,
  combo_detection_window_ms: 2000,
  combo_penalty_repeat: 7,
  combo_penalty_pts: 2000,
  combo_2_bonus: 0,
  combo_3_bonus: 0,
  combo_4_bonus: 1000,
  combo_5_bonus: 2000,
  combo_6_bonus: 2000,
  combo_7_bonus: 2000,
  combo_8_bonus: 2000,
  combo_9_bonus: 1500,
  combo_10_bonus: 1500,
  combo_11_bonus: 1550,
  combo_14_bonus: 2000,
  combo_15_bonus: 2000,
  combo_16_bonus: 2000,
  enforcer_charge_max: 80,
  enforcer_weight_bumper: 1,
  enforcer_weight_rail: 0.3,
  enforcer_weight_combo: 1,
  enforcer_weight_other: 1,
  viper_charge_max: 80,
  viper_ulti_duration_ms: 8000,
  viper_rampage_multiplier: 5,
  ghost_charge_max: 60,
  oracle_charge_max: 80,
  oracle_ulti_duration_ms: 5000,
  oracle_slow_factor: 0.25,
  oracle_time_rate: 1,
  oracle_activation_min_ratio: 0.05,
  streak_window_ms: 2000,
  streak_tier_1_count: 2,
  streak_tier_2_count: 5,
  streak_tier_3_count: 10,
  streak_tier_1_multiplier: 1.5,
  streak_tier_2_multiplier: 2,
  streak_tier_3_multiplier: 3,
  rail_tick_interval_ms: 100,
  rail_max_session_ms: 10000,
  rail_base_score: 4,
  rail_max_fib_step: 7,
  boss_death_anim_ms: 3000,
  boss_score_threshold: 15000,
  pve_tick_interval_ms: 250,
})

const stubApiEnv = (): void => {
  vi.stubGlobal("__ENV__", { VITE_API_URL: "http://api.test" })
}

describe("backend admin API client", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("fetches backend config with the admin bearer token", async () => {
    stubApiEnv()
    const config = makeBackendConfig()
    const fetchMock = vi.fn(() => Promise.resolve(Response.json(config)))
    vi.stubGlobal("fetch", fetchMock)

    await expect(fetchBackendConfig(" admin-token ")).resolves.toEqual(config)

    expect(fetchMock).toHaveBeenCalledWith("http://api.test/api/v1/admin/config", {
      method: "GET",
      headers: {
        Authorization: "Bearer admin-token",
      },
    })
  })

  it("patches only the edited fields", async () => {
    stubApiEnv()
    const config = makeBackendConfig()
    const fetchMock = vi.fn(() => Promise.resolve(Response.json(config)))
    vi.stubGlobal("fetch", fetchMock)

    await expect(patchBackendConfig("admin-token", { bumper_score: 250 })).resolves.toEqual(config)

    expect(fetchMock).toHaveBeenCalledWith("http://api.test/api/v1/admin/config", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer admin-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bumper_score: 250 }),
    })
  })

  it("surfaces backend authorization errors", async () => {
    stubApiEnv()
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("nope", { status: 401 }))),
    )

    await expect(fetchBackendConfig("bad-token")).rejects.toMatchObject({
      name: "BackendAdminApiError",
      status: 401,
      message: "GET /api/v1/admin/config -> 401: nope",
    })
  })

  it("wraps network failures", async () => {
    stubApiEnv()
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("network down"))),
    )

    await expect(fetchBackendConfig("admin-token")).rejects.toMatchObject({
      name: "BackendAdminApiError",
      message: "GET /api/v1/admin/config failed",
    })
  })
})
