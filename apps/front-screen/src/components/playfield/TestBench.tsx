import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { BENCH_FLOOR_FRICTION, BENCH_HALF_DEPTH, BENCH_HALF_WIDTH } from "../physics/physicsConfig"

const WALL_HEIGHT = 1.5

const TestBench = () => (
  <RigidBody type="fixed" colliders={false}>
    <CuboidCollider
      args={[BENCH_HALF_WIDTH, 0.1, BENCH_HALF_DEPTH]}
      position={[0, 0, 0]}
      friction={BENCH_FLOOR_FRICTION}
      restitution={0.3}
    />
    <CuboidCollider
      args={[0.1, WALL_HEIGHT, BENCH_HALF_DEPTH]}
      position={[-BENCH_HALF_WIDTH, WALL_HEIGHT, 0]}
    />
    <CuboidCollider
      args={[0.1, WALL_HEIGHT, BENCH_HALF_DEPTH]}
      position={[BENCH_HALF_WIDTH, WALL_HEIGHT, 0]}
    />
    <CuboidCollider
      args={[BENCH_HALF_WIDTH, WALL_HEIGHT, 0.1]}
      position={[0, WALL_HEIGHT, -BENCH_HALF_DEPTH]}
    />
  </RigidBody>
)

export default TestBench
