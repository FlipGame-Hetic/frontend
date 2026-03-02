# E2E Tests — back-screen

Playwright tests for the secondary view / scoreboard (port 3001).

## What to test

- **Scoreboard**: player scores and names update when GAME_STATE arrives
- **Game phase screens**: waiting / playing / game over show the right content
- **WebSocket lifecycle**: connection, reconnection/error states
- **App bootstrap**: page responds 200 and mounts correctly

## What NOT to test

- Anything inside `<canvas>` — Playwright is blind to WebGL content
- 3D rendering, physics, ball trajectories
- Frame rate or visual appearance of the Three.js scene

## Pattern: mock the WebSocket

Inject a fake WS server via `page.evaluate()` or a Playwright fixture so tests
control game state without needing the real backend running.
