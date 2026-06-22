# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## State management

Runtime state lives in one of two worlds, and the choice is deliberate.

**Reactive state → Zustand.** Use a Zustand store when a change must re-render
React (score, game phase, ball list, ultimate bar, …). Stores live in `stores/`
and are named `use*Store.ts`. **`stores/` contains Zustand stores only** — if a
file in there is not a Zustand store, it is misfiled.

**Non-reactive state → module singletons / refs.** Most gameplay runs in the
physics loop (`useFrame`, collision callbacks) at 60 fps. State that is read or
written there must **not** go through Zustand or component state, because every
change would trigger a render. It is held as plain module-level values or React
refs instead, co-located with the feature that owns it (e.g. `components/balls/`,
`components/playfield/`, `input/`).

Non-reactive state is named by a fixed suffix so the pattern is recognizable:

| Suffix      | Meaning                                                                      | Examples                                                                  |
| ----------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `*Registry` | A lookup table of `id → live handle` you explicitly register / unregister.   | `ballBodyRegistry`, `ballPositionRegistry`, `ballFadeRegistry`            |
| `*State`    | A mutable status / state machine tracker (flags, phases, per-entity status). | `inputState`, `railState`, `portalTraversalState`, `multiballBounceState` |
| `*Queue`    | A FIFO buffer drained elsewhere.                                             | `particleBurstQueue`                                                      |

Two scopes share the same goal of bypassing the render cycle:

- **Module singleton** — _global_ state read by many consumers across the tree
  (the registries above). Avoids prop-drilling refs and gives O(1) lookups by id.
- **React ref** — the _per-component-instance_ variant of the same idea, for
  state only one component cares about (e.g. the plunger state machine in
  `usePlungerSimulation`, the gate state machine in `MultiballGate`). Pure logic
  is kept in a tested reducer (`multiballGateRuntime.ts`); the ref just holds the
  current value.

A registry and a ref are **not** two ways to store the same thing — they are
_global_ vs _per-instance_. Pick Zustand only when React actually needs to
re-render.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x"
import reactDom from "eslint-plugin-react-dom"

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Models credits

"pinball flipper" (https://skfb.ly/6sTnq) by andrvalg is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
