import { defineConfig, type Plugin } from "vitest/config"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { cpSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import { DRACO_DECODER_PATH, KTX2_TRANSCODER_PATH } from "./src/three/decoderConfig"

const publicSubdir = (publicPath: string) => publicPath.replaceAll("/", "")

// Copies the KTX2 (Basis) transcoder and Draco decoder out of the *installed* three package into the app's
// public dir on every dev start / build, so the playfield GLB's compressed textures and geometry decode from
// local `/basis/` + `/draco/` paths (never a runtime CDN) and the decoder versions always track the three
// version in use. Vite serves + bundles `public/` natively (correct `application/wasm`, etc.), and the copied
// folders are git-ignored — they are regenerated here, never committed. three's `exports` map forbids
// `./package.json`, so the libs dir is resolved from an exported loader subpath.
const syncThreeDecoders = (): Plugin => {
  let publicDir: string | false = false
  return {
    name: "sync-three-decoders",
    configResolved(config) {
      publicDir = config.publicDir
    },
    buildStart() {
      if (!publicDir) return
      const require = createRequire(import.meta.url)
      const threeLibsDir = resolve(
        dirname(require.resolve("three/examples/jsm/loaders/KTX2Loader.js")),
        "../libs",
      )
      cpSync(
        resolve(threeLibsDir, "basis"),
        resolve(publicDir, publicSubdir(KTX2_TRANSCODER_PATH)),
        {
          recursive: true,
        },
      )
      cpSync(resolve(threeLibsDir, "draco"), resolve(publicDir, publicSubdir(DRACO_DECODER_PATH)), {
        recursive: true,
      })
    },
  }
}

// The unit suite drives Vitest through this same config but has no DOM canvas, so skip the decoder copy there.
const decoderPlugins = process.env.VITEST === "true" ? [] : [syncThreeDecoders()]

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), ...decoderPlugins],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3000,
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./tests/unit/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx", "src/vite-env.d.ts", "src/**/*.d.ts", "src/**/types.ts"],
    },
  },
})
