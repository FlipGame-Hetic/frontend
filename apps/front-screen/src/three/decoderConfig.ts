// Single source of truth for the local URL paths the self-hosted decoders are served from. Shared across two
// execution contexts so the "where the loader looks" and "where the build puts the files" can never drift:
//   - browser runtime — ktx2Loader.ts points the Basis transcoder here; useModel.ts passes the Draco path
//     to drei's useGLTF
//   - Node build — vite.config.ts's `sync-three-decoders` plugin copies these decoders out of the *installed*
//     `three` into public/<here> on dev + build, so the versions track the three in use and there is no CDN
// Kept dependency-free on purpose so vite.config (Node) can import it without pulling `three` into the config.
//   - Basis transcoder (basis_transcoder.{js,wasm}) → decodes KTX2 / KHR_texture_basisu textures
//   - Draco decoder (draco_decoder.*)               → decodes KHR_draco_mesh_compression geometry
export const KTX2_TRANSCODER_PATH = "/basis/"
export const DRACO_DECODER_PATH = "/draco/"
