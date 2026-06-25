// Rapier collision groups pack a membership (high 16 bits) and a filter mask (low 16 bits). Two bodies collide only if each one's membership is in the other's filter

// Membership bits identifying balls and rails
const BALL_COLLISION_MEMBERSHIP = 0x0001
export const RAIL_COLLISION_MEMBERSHIP = 0x0002

// Rail belongs to its group and only collides with balls
export const RAIL_COLLISION_GROUPS = (BALL_COLLISION_MEMBERSHIP << 16) | RAIL_COLLISION_MEMBERSHIP

// Default ball, collides with everything (rails included)
export const BALL_COLLISION_GROUPS_WITH_RAILS = (0xffff << 16) | BALL_COLLISION_MEMBERSHIP

// Every bit except the rail one
const BALL_FILTER_WITHOUT_RAILS = 0xffff & ~RAIL_COLLISION_MEMBERSHIP

// Used by the floor-snap ray so it passes through rails instead of mistaking a rail for the floor
export const BALL_COLLISION_GROUPS_IGNORE_RAILS =
  (BALL_FILTER_WITHOUT_RAILS << 16) | BALL_COLLISION_MEMBERSHIP
