# Development and real Web recordings

`src/client.tsx` registers the official settings section. `src/background.mjs` attaches to the host's `data-conversation-content` hero area and styles `data-composer-card`. `vendor/ascii-sharks/` contains the directly adapted upstream engine. `src/settings.mjs` validates stored preferences.

```sh
npm ci --legacy-peer-deps
npm run check
```

Unit checks cover persisted input validation, selected-color midtones, anatomical Hanzi positions, grid extremes, zero/max fish population, simulation speed and canvas lifecycle disposal. The browser check also exercises the piecewise numeric steps through keyboard and native spinner input, both themes, fonts, persistence and composer interaction. It requires an isolated local DSH Web with this plugin installed and does not send messages to a model.

Animation fonts are embedded as WOFF data URLs. Subset coverage, pinned sources and included OFL licenses are documented in [assets/fonts/README.md](../assets/fonts/README.md).

```powershell
$env:PLAYWRIGHT_MODULE = '<absolute-path-to-playwright>'
$env:DSH_TEST_URL = '<local-test-instance-url>'
node scripts/browser-check.mjs
```

For recording, use an isolated demo profile with synthetic sidebar data. This project follows the real Web workflow documented in [dsh-reference-anything](https://github.com/Chael-Chael/dsh-reference-anything/tree/main/scripts/web-demos): Edge/Playwright WebM → trimmed MP4 → palette GIF. Source video stays under ignored `.local/recordings/`. Public output is `docs/media/`.

```powershell
Remove-Item Env:DSH_TEST_URL -ErrorAction SilentlyContinue
$env:DSH_INSTANCE_FILE = '<path-to-demo-instance.json>'
$env:DSH_DEMO_FONT = '<optional-path-to-SourceHanSansSC-VF.otf>'
node scripts/browser-check.mjs --record
```

Requires Edge, Playwright, ffmpeg and ffprobe. The instance file contains `{ "url": "..." }`. Keep token-bearing instance files and logs local. Never use the everyday Desktop profile for recording or automated UI experiments.

Recordings use a 1280×800 viewport and export 960×600, 15 fps looping GIFs with pointer/click cues. The six scenes cover ASCII light/dark, Hanzi light/dark, settings and the local font picker. The recording context grants local-font access to its isolated browser context and selects installed Consolas/SimSun fonts. Inspect both themes and settings captures after every visual change. `docs/media/manifest.json` records segment timing. User and agent data are not suitable public fixtures.
