# Third-party source

The animation is directly adapted from **[ascii-sharks](https://github.com/stackedlol/ascii-sharks)** by **stackedlol**.

- Source commit: [`c521e24a787e6d4cc460d4cf2b9815f25e4fe453`](https://github.com/stackedlol/ascii-sharks/tree/c521e24a787e6d4cc460d4cf2b9815f25e4fe453)
- Local source: `vendor/ascii-sharks/`
- Retained: fixed-timestep engine, fish schooling, pursuit, flexible spines, cell rasterization, lighting, glyph shading and wake diffusion.
- Adapted: whale geometry, transparent canvas, light/dark palettes, selected color, cell/grid/wake controls, configurable fish population, anatomical Hanzi glyphs and hidden-page pausing.
- DSH integration, settings, neutral composer glass and demo scripts are original additions.

The bundled animation font subsets derive from Geist Mono (The Geist Project Authors) and Source Han Serif (Adobe), both under SIL Open Font License 1.1. Original notices, source revisions and subset details are in [assets/fonts/README.md](assets/fonts/README.md); both OFL files are included in the npm package. No Founder font files are included.

The pinned upstream snapshot does not include a separate LICENSE file. The MIT license for this project's original integration does not relicense the upstream source. Upstream authorship is preserved here and in the published bundle.

Glass implementation research: [cnayu/dsh-glass-theme](https://github.com/cnayu/dsh-glass-theme) and [noexcs/dsh-skin-glass](https://github.com/noexcs/dsh-skin-glass). Our scoped CSS uses an independent pseudo-element to avoid changing the containing block of fixed composer menus. Neither theme is a runtime dependency.

## ascii-kanji-sharks

The Kanji style adapts [michikusa404/ascii-kanji-sharks](https://github.com/michikusa404/ascii-kanji-sharks), commit `7153916aebba0f34ce2d46904ad192188cdc6ceb`, copyright (c) 2026 michikusa404, under the MIT License. The complete notice is included in `vendor/ascii-kanji-sharks/LICENSE` and the npm package.

Retained: ink-measured glyph shading and text effects. Swimming, fish schooling, pursuit, spine motion and body waves use the shared stackedlol/ascii-sharks implementation. Adapted: whale silhouette (rounded head, long flippers, broad tail flukes, no gills or pelvic fins), transparent background, shared lifecycle and movement simulation, configurable populations/size/color/grid/wakes, and bundled Source Han Serif instead of remote Google Fonts.
