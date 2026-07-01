import { describe, expect, it } from "vitest"
import {
  BACKEND_CONFIG_CATEGORIES,
  BACKEND_CONFIG_FIELDS,
  BACKEND_CONFIG_KEYS,
} from "@/debug/backendConfigCatalog"
import type { BackendConfigKey } from "@/debug/backendConfigTypes"

const EXPECTED_BACKEND_CONFIG_KEYS = [
  "default_lives",
  "ultime_charge_ratio",
  "ball_saver_score",
  "bumper_score",
  "bumper_triangle_score",
  "portal_score",
  "multiball_ring_threshold",
  "multiball_score",
  "timer_bonus_seconds",
  "timer_bonus_score",
  "timer_bonus_multiplier",
  "tilt_penalty_1",
  "tilt_penalty_2",
  "boss_0_hp",
  "boss_1_hp",
  "boss_2_hp",
  "boss_0_difficulty_scale",
  "boss_1_difficulty_scale",
  "boss_2_difficulty_scale",
  "endless_base_difficulty_scale",
  "endless_level_scale_exponent",
  "combo_buffer_max",
  "combo_detection_window_ms",
  "combo_penalty_repeat",
  "combo_penalty_pts",
  "combo_2_bonus",
  "combo_3_bonus",
  "combo_4_bonus",
  "combo_5_bonus",
  "combo_6_bonus",
  "combo_7_bonus",
  "combo_8_bonus",
  "combo_9_bonus",
  "combo_10_bonus",
  "combo_11_bonus",
  "combo_14_bonus",
  "combo_15_bonus",
  "combo_16_bonus",
  "enforcer_charge_max",
  "enforcer_weight_bumper",
  "enforcer_weight_rail",
  "enforcer_weight_combo",
  "enforcer_weight_other",
  "viper_charge_max",
  "viper_ulti_duration_ms",
  "viper_rampage_multiplier",
  "ghost_charge_max",
  "oracle_charge_max",
  "oracle_ulti_duration_ms",
  "oracle_slow_factor",
  "oracle_time_rate",
  "oracle_activation_min_ratio",
  "streak_window_ms",
  "streak_tier_1_count",
  "streak_tier_2_count",
  "streak_tier_3_count",
  "streak_tier_1_multiplier",
  "streak_tier_2_multiplier",
  "streak_tier_3_multiplier",
  "rail_tick_interval_ms",
  "rail_max_session_ms",
  "rail_base_score",
  "rail_max_fib_step",
  "boss_death_anim_ms",
  "boss_score_threshold",
  "pve_tick_interval_ms",
] as const satisfies readonly BackendConfigKey[]

describe("backend config catalog", () => {
  it("covers every backend config field once", () => {
    expect(BACKEND_CONFIG_KEYS).toEqual(EXPECTED_BACKEND_CONFIG_KEYS)
    expect(new Set(BACKEND_CONFIG_KEYS).size).toBe(BACKEND_CONFIG_KEYS.length)
  })

  it("keeps every category populated", () => {
    const populatedCategories = new Set(BACKEND_CONFIG_FIELDS.map((field) => field.category))

    for (const category of BACKEND_CONFIG_CATEGORIES) {
      expect(populatedCategories.has(category.label)).toBe(true)
    }
  })
})
