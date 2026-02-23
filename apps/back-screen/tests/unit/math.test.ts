import { describe, it, expect } from "vitest";
import { clamp, lerp } from "@frontend/utils";

describe("clamp", () => {
  it("clamps value within range", () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
  });
});

describe("lerp", () => {
  it("interpolates between two values", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
  });
});
