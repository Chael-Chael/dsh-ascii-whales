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

Recordings use a 1280×800 viewport and export 960×600, 15 fps looping GIFs with pointer/click cues. The nine scenes cover ASCII, Hanzi and Kanji in light/dark themes, settings, the local font picker and Humpback → Orca switching in ASCII / Kanji. Hanzi scenes use a 0.8× character grid; both settings and font-picker demos use ASCII mode. These are recording presets, not changes to plugin defaults. The recording context grants local-font access to its isolated browser context and selects installed Consolas/SimSun fonts. Inspect both themes and settings captures after every visual change. `docs/media/manifest.json` records segment timing and character modes. User and agent data are not suitable public fixtures.

## Automated releases

`.github/workflows/release.yml` checks main pushes without publishing. A `v*` tag must match package.json, point to a commit on main, and be triggered (including reruns) by `Chael-Chael` in this repository before publishing. Manual runs use the same rules: branch runs only check; tag runs may publish.

Configure npm Trusted Publisher for `Chael-Chael/dsh-ascii-whales`, workflow `release.yml`, no environment, with `npm publish` permission. Node 24 supplies npm OIDC support; no npm token is stored in GitHub. The workflow checks, packs once, uploads the candidate artifact, publishes with provenance and attaches that same tarball to GitHub Release. If rerun after npm succeeded, the published tarball hash must match before creating the release.

These workflow checks do not replace GitHub branch/tag rulesets. At the 2026-10-22 audit, main and tags had no protection rules; only the owner had repository write permission and there were no deploy keys.
