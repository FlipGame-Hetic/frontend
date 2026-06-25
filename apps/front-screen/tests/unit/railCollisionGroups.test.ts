import { describe, expect, it } from "vitest"
import {
  BALL_COLLISION_GROUPS_IGNORE_RAILS,
  BALL_COLLISION_GROUPS_WITH_RAILS,
  RAIL_COLLISION_GROUPS,
  RAIL_COLLISION_MEMBERSHIP,
} from "@/components/rails/railCollisionGroups"

const collides = (groupsA: number, groupsB: number): boolean => {
  const membershipA = groupsA & 0xffff
  const filterA = groupsA >>> 16
  const membershipB = groupsB & 0xffff
  const filterB = groupsB >>> 16
  return (membershipA & filterB) !== 0 && (membershipB & filterA) !== 0
}

describe("railCollisionGroups", () => {
  it("lets balls collide with rails by default", () => {
    expect(collides(BALL_COLLISION_GROUPS_WITH_RAILS, RAIL_COLLISION_GROUPS)).toBe(true)
  })

  it("ignores rails only for balls in the ground zone", () => {
    expect(collides(BALL_COLLISION_GROUPS_IGNORE_RAILS, RAIL_COLLISION_GROUPS)).toBe(false)
    expect(
      collides(BALL_COLLISION_GROUPS_WITH_RAILS, RAIL_COLLISION_GROUPS) &&
        !collides(BALL_COLLISION_GROUPS_IGNORE_RAILS, RAIL_COLLISION_GROUPS),
    ).toBe(true)
  })

  it("keeps rail membership separate from the ball group", () => {
    expect(RAIL_COLLISION_MEMBERSHIP).not.toBe(BALL_COLLISION_GROUPS_WITH_RAILS & 0xffff)
  })
})
