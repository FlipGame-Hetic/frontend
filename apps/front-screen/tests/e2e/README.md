# E2E Tests — front-screen

Playwright tests for the player-facing view (port 3000).

## What to test

- **UI overlays**: score display, player turn indicator, game phase screens
  (waiting / playing / game over) — these are DOM elements, fully testable
- **WebSocket lifecycle**: JOIN_ROOM sent on load, reconnection/error states
- **Game state → DOM**: mock a GAME_STATE message and assert the HUD updates
- **Controls**: key presses dispatch FLIP_LEFT / FLIP_RIGHT WS messages
- **App bootstrap**: page responds 200 and mounts correctly

## What NOT to test

- Anything inside `<canvas>` — Playwright is blind to WebGL content
- 3D rendering, physics, ball trajectories, flipper angles
- Frame rate or visual appearance of the Three.js scene

## Pattern: mock the WebSocket

Inject a fake WS server via `page.evaluate()` or a Playwright fixture so tests
control game state without needing the real backend running.
