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

Open **Settings → ASCII Whales**. Verified with DSH **0.2.1-rc.2**, Windows and Microsoft Edge Web. Use Desktop's own plugin manager for Desktop installations.

## Your ocean

The animation fills the empty chat area behind the title and composer. It follows the native light/dark theme and disappears in existing conversations. Glass is neutral white or charcoal, with no blue tint; colors passing behind it are naturally blurred.

![Dark mode](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/dark.gif)

| Setting | Default | Range |
| --- | --- | --- |
| Show whales | On | Entire scene and its glass |
| Whale color | `#4d6bfe` | Visual swatches and system color picker; fish and wakes follow |
| Whales | 3 | 1–6 |
| Size | 1× | 0.6–1.5× |
| Speed | 1× | 0.2–2× |
| Scene opacity | 0.75 | 0.15–0.95 |
| Cell size | 1× | 0.75–2× |
| Background grid opacity | 0.05 | 0–0.25 |
| Small fish | 170 | 0–340 |
| Wake intensity | 1 | 0–3 |
| Frosted glass | On | Independent toggle |
| Glass blur | 14 px | 0–32 px |
| Glass opacity | 0.45 | 0–1 |

Set grid, fish or wake to zero to hide it. The default whales have relative sizes of 100%, 70% and 84%; the size control scales them together. Small fish are dashes whose dimensions follow the character grid.

Settings use official DSH controls. The black **Restore defaults** button brings back the original blue ocean. Preferences stay in this browser/origin. Reduced-motion preferences are respected; animation pauses in background tabs.

![Settings and colors](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/settings.gif)

## Source and development

This directly adapts **[stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks)**, retaining its simulation, flexible spines, ASCII rasterizer and lighting. The whale shape, DSH integration, palettes and controls are adaptations. See [source attribution](THIRD_PARTY_NOTICES.md) for the pinned commit and ownership scope.

```sh
npm ci --legacy-peer-deps
npm run check
npm pack
```

The bundled animation needs no CDN, model calls or chat content. See [development](docs/development.md) and [validation](docs/validation.md). The scoped DOM adapter may need updates when DSH changes. Composer themes can conflict; disable this plugin's glass if necessary. Desktop window validation is separate from Web validation.
