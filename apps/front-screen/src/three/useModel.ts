import { useGLTF } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { type AnimationClip, type Group, type WebGLRenderer } from "three"
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js"
import { DRACO_DECODER_PATH, KTX2_TRANSCODER_PATH } from "./decoderConfig"

// One transcoder for the whole app : rebuilding it per load would refetch the Basis wasm and spawn a fresh
// worker pool every time. `detectSupport` must run against the live renderer so the transcoder targets a
// compressed format the current GPU can sample (ASTC / BC7 / ETC ...).
let sharedKtx2Loader: KTX2Loader | null = null

const getKtx2Loader = (gl: WebGLRenderer): KTX2Loader => {
  sharedKtx2Loader ??= new KTX2Loader().setTranscoderPath(KTX2_TRANSCODER_PATH)
  sharedKtx2Loader.detectSupport(gl)
  return sharedKtx2Loader
}

// drei's `useGLTF` hands its `extendLoader` callback a three-stdlib GLTFLoader, whose `setKTX2Loader` is typed
// against three-stdlib's own KTX2Loader. We deliberately use three's KTX2Loader (so the transcoder matches the
// installed three's Basis wasm) — the two are structurally identical and interchangeable at runtime, so we
// bridge the nominal types with a single assertion. Draco is handled by drei itself (the `useDraco` path arg),
// so KTX2 is the only decoder we attach here.
interface Ktx2ExtensibleLoader {
  setKTX2Loader: (ktx2: KTX2Loader) => unknown
}

const attachKtx2Loader =
  (gl: WebGLRenderer) =>
  (loader: unknown): void => {
    const gltfLoader = loader as Ktx2ExtensibleLoader
    gltfLoader.setKTX2Loader(getKtx2Loader(gl))
  }

// Loads (and drei-caches) a GLB whose geometry is Draco-compressed and whose textures are KTX2, wiring the
// self-hosted decoders : Draco via the `useDraco` decoder-path argument, KTX2 via the extendLoader callback.
// Takes a plain URL so it works for any model and keeps callers decoupled from the loader internals. The
// return type is annotated with three's own types so the hook's contract doesn't leak drei / three-stdlib's
// `GLTF` type — which also avoids a non-portable inferred type (TS2742), since three-stdlib is not a direct dep.
const useModel = (url: string): { scene: Group; animations: AnimationClip[] } => {
  const gl = useThree((state) => state.gl)
  return useGLTF(url, DRACO_DECODER_PATH, true, attachKtx2Loader(gl))
}

export default useModel
