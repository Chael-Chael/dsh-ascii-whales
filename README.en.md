# ASCII Whales · DeepSeek Harness

Let whales drift through the quiet, and thoughts rise to the surface.

A blue ocean unfolds behind each empty chat. Schools of tiny fish scatter between characters; wakes fade slowly, and a pane of frosted glass holds the words you have yet to write.

[中文](README.md) · [npm](https://www.npmjs.com/package/dsh-ascii-whales) · [Releases](https://github.com/Chael-Chael/dsh-ascii-whales/releases)

![Light mode](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/light.gif)

## Install

`main` is the **0.1.1 development version**, including Hanzi and bundled/custom fonts. npm remains at **0.1.0**; this update has not been published there yet.

Add **`dsh-ascii-whales`** through DeepSeek Harness's plugin manager, then restart that instance. For a Web profile:

```sh
dsh plugin --profile web add dsh-ascii-whales
```

Open **Settings → ASCII Whales**. Verified with DSH **0.2.1-rc.2**, Windows and Microsoft Edge Web. Use Desktop's own plugin manager for Desktop installations.

## Your ocean

The animation fills the empty chat area behind the title and composer. It follows the native light/dark theme and disappears in existing conversations. Glass is neutral white or charcoal, with no blue tint; colors passing behind it are naturally blurred.

Your chosen color anchors the whale body's midtones, with gentle shadows and highlights. Both themes use the same body palette, carrying your shade of blue from daylight into night.

Choose **Settings → ASCII Whales → Character style → Hanzi** for Chinese characters: 吻 at the snout, 目 at the eyes, 背 along the back, 鳍 on fins and 尾 on tail flukes. Water and ocean characters fill the body; fish become 鱼, 鲤, 鲭 and 鲱. These labels follow the bending body. Hanzi use wider cells, adjustable with cell size.

The plugin embeds **Geist Mono 600** for ASCII, matching the upstream demo, and **Source Han Serif** for Hanzi. These animation-only subsets load offline. Choose **Font → Local custom** to enter separate installed English and Chinese font names. Blank or unavailable names fall back to the bundled font. Local font files are never uploaded or packaged.

**Scan local fonts** fills the official dropdown menus after browser permission is granted. Manual entry remains available when scanning is unsupported.

![Hanzi · light](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/hanzi-light.gif)
![Hanzi · dark](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/hanzi-dark.gif)

![Dark mode](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/dark.gif)

| Setting | Default | Range |
| --- | --- | --- |
| Show whales | On | Entire scene and its glass |
| Character style | ASCII | ASCII / Hanzi; applied immediately and saved |
| Font | Bundled default | Bundled default / Local custom; separate saved English and Chinese names |
| Whale color | `#4d6bfe` | Visual swatches and system color picker; fish and wakes follow |
| Whales | 3 | 1–20 |
| Size | 1× | 0.1–10× |
| Speed | 1× | 0.1–10× |
| Scene opacity | 1 | 0–1; 1 is fully opaque |
| Cell size | 1× | 0.1–10× |
| Background grid opacity | 0.05 | 0–1 |
| Small fish | 170 | 0–1000 |
| Wake intensity | 1 | 0–10 |
| Frosted glass | On | Independent toggle |
| Glass blur | 14 px | 0–64 px |
| Glass opacity | 0.45 | 0–1 |

Size, cell size, speed and wake step by **0.05** below 1 and **0.1** from 1 upward: `0.95 ↔ 1 ↔ 1.1`. You can also type values directly.

Set grid opacity, fish count or wake to zero to hide it. The default whales have relative sizes of 100%, 70% and 84%; the size control scales them together. Small fish are dashes in ASCII mode and fish characters in Hanzi mode; their dimensions follow the character grid.

Settings use official DSH controls. **Restore defaults** uses the theme-aware primary button and brings back the original blue ocean. Preferences stay in this browser/origin. Reduced-motion preferences are respected; animation pauses in background tabs. Fine grids with many whales or high speeds increase rendering cost.

Upgrading from 0.1.0 preserves your saved opacity. Set scene opacity to **1**, or use **Restore defaults**, to see the new full-color appearance.

![Settings and colors](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/settings.gif)

![Bundled fonts and local font dropdowns](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/fonts.gif)

## Source and development

This directly adapts **[stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks)**, retaining its simulation, flexible spines, ASCII rasterizer and lighting. The whale shape, DSH integration, palettes and controls are adaptations. See [source attribution](THIRD_PARTY_NOTICES.md) for the pinned commit and ownership scope.

```sh
npm ci --legacy-peer-deps
npm run check
npm pack
```

The bundled animation needs no CDN, model calls or chat content. See [development](docs/development.md) and [validation](docs/validation.md). The scoped DOM adapter may need updates when DSH changes. Composer themes can conflict; disable this plugin's glass if necessary. Desktop window validation is separate from Web validation.
