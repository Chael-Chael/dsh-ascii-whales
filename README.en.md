# ASCII Whales · DeepSeek Harness

Let whales drift through the quiet, and thoughts rise to the surface.

A blue ocean unfolds behind each empty chat. Schools of tiny fish scatter between characters; wakes fade slowly, and a pane of frosted glass holds the words you have yet to write.

[中文](README.md) · [npm](https://www.npmjs.com/package/dsh-ascii-whales) · [Releases](https://github.com/Chael-Chael/dsh-ascii-whales/releases)

![Light mode](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/light.gif)

## Install

Add **`dsh-ascii-whales`** through DeepSeek Harness's plugin manager, then restart that instance. For a Web profile:

```sh
dsh plugin --profile web add dsh-ascii-whales
```

Open **Settings → ASCII Whales**. Use Desktop's own plugin manager for Desktop installations.

## Your ocean

The animation fills the empty chat area behind the title and composer. It follows the native light/dark theme and disappears in existing conversations. Glass is neutral white or charcoal, with no blue tint; colors passing behind it are naturally blurred.

Your chosen color anchors the whale body's midtones, with deeper shadows and brighter highlights that preserve per-cell lighting and body volume. Both themes use the same body palette, carrying your shade of blue from daylight into night.

Choose **Settings → ASCII Whales → Character style → Hanzi** for Chinese characters: 吻 at the snout, 目 at the eyes, 背 along the back, 鳍 on fins and 尾 on tail flukes. Water and ocean characters fill the body; fish become 鱼, 鲤, 鲭 and 鲱. These labels follow the bending body. Hanzi use wider cells, adjustable with cell size.

The plugin embeds **Geist Mono 600** for ASCII, matching the upstream demo, and **Source Han Serif** for Hanzi. These animation fonts load offline. Choose **Font → Local custom** to enter separate installed English and Chinese font names.

Click **Scan local fonts**, allow browser access, then choose from the dropdown menus. You can also type a font name directly.

![Hanzi · light](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/hanzi-light.gif)
![Hanzi · dark](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/hanzi-dark.gif)

![Dark mode](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/dark.gif)

| Setting | Default | Range |
| --- | --- | --- |
| Show whales | On | Entire scene and its glass |
| Character style | ASCII | ASCII / Hanzi / Kanji; applied immediately and saved |
| Font | Bundled default | Bundled default / Local custom; separate saved English and Chinese names |
| Eye background | Follow main color | Controls the eye cell background, with contrasting text. Defaults to body shading; choose black or white. Kanji defaults to transparent and adds an eye tile only for black/white |
| Colorful shimmer | Off | ASCII / Hanzi: selected-color shades by default; enable the original seven-color glyph accents. Body color is unchanged. Not applicable to Kanji |
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

Settings use official DSH controls. **Restore defaults** uses the theme-aware primary button and brings back the original blue ocean. Preferences are saved in this browser. The animation follows reduced-motion preferences and pauses in background tabs.

![Settings and colors](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/settings.gif)

![Bundled fonts and local font dropdowns](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/fonts.gif)

## Source and development

This adapts **[stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks)**, retaining its simulation, flexible spines, ASCII rasterizer and lighting. The whale shape, DSH integration, palettes and controls are adaptations. See [source attribution](THIRD_PARTY_NOTICES.md) for the pinned commit and credits.

The **Kanji** style adapts **[ascii-kanji-sharks · 漢字の海](https://github.com/michikusa404/ascii-kanji-sharks)** by **[michikusa404](https://github.com/michikusa404)** (MIT License, Copyright © 2026 michikusa404). Its ink-measured Kanji shading and text effects come from that project; movement and schooling use stackedlol/ascii-sharks. Our adaptations replace the shark silhouette with whales and add DSH integration, a transparent background, adjustable settings and offline fonts. The full license is preserved in [vendor/ascii-kanji-sharks/LICENSE](vendor/ascii-kanji-sharks/LICENSE).

Thank you to **michikusa404** for turning Kanji into an ocean, and to **stackedlol** for the character-based schools and animation. Their publicly shared source made it possible to bring this sea into DeepSeek Harness.

```sh
npm ci --legacy-peer-deps
npm run check
npm pack
```

Animation and fonts are bundled for offline loading. See [development and recording](docs/development.md) and [test results](docs/validation.md).

## Kanji

Choose **Character style → Kanji** for the MIT-licensed [ascii-kanji-sharks](https://github.com/michikusa404/ascii-kanji-sharks) simulation, adapted to whales: schools, ink-measured shading and feeding text effects. Existing population, size, speed, color, grid, wake and font controls apply. Cells have a 4 px minimum (about 0.22×; lower settings use the same cell size). Kanji uses the Chinese font field; the English font field applies only to ASCII. Fonts are bundled for offline use; both whale styles remain available.

All three styles support visibility, count, size, speed, opacity, cell size, grid opacity, small fish count, wake intensity, color, fonts and the glass toggle/blur/opacity. Color affects bodies, fish and wakes; eye backgrounds follow body shading by default, with optional black or white. Kanji glints and sound effects retain theme accents. The first three whales use relative sizes of 100%, 70% and 84%.

Kanji shares the stackedlol/ascii-sharks simulation, pursuit, turning and body wave with ASCII / Hanzi, retaining the whale silhouette with Kanji shading and text effects.
