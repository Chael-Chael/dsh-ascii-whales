# 0.1.1 validation · 2026-10-21

Selected-color midtones, anatomical Hanzi, bundled/local fonts and expanded controls. Published as [GitHub v0.1.1](https://github.com/Chael-Chael/dsh-ascii-whales/releases/tag/v0.1.1) and [npm 0.1.1](https://www.npmjs.com/package/dsh-ascii-whales/v/0.1.1).

Published tarball: `dsh-ascii-whales@0.1.1`, SHA-1 `066f0ab991441530b09e02356941bfb7ceff77bf`. GitHub asset and npm submission have the same SHA-256: `7d231b908df0c680a7dc017790f085f65b75fb13c08e8eda9daf672485c4a53a`. Installed client SHA-256: `E51C0928CDFAB4FD48B25D8070445A4DF8E5D69136978D3872A7800DCB758468`, matching the recorded demo candidate; final packaging includes the revised READMEs.

| Layer | Result | Evidence |
| --- | --- | --- |
| TypeScript, build, unit checks | PASS | `npm run check`, 6 tests; midtones in both themes, anatomical glyphs at three headings, fine/coarse cells, 20 whales, 1000 fish, simulation speed 0.1/1/10 and disposal |
| Real Agent Web | PASS | Windows / Edge, isolated `agent-browser-test`; ASCII/Hanzi in light/dark, settings persistence, reset, draft editing, existing/new chat, reduced motion and 640 px layout; zero page errors |
| Piecewise numeric steps | PASS | Size/grid/speed: 0.1–10; wake: 0–10. Actual keyboard and native spinner checks cover `0.95 ↔ 1 ↔ 1.1`, lower/upper bounds and manually typing 0.9 |
| Bundled/local fonts | PASS | Embedded Geist Mono 600 and Source Han Serif load offline; real font enumeration returns 903 faces / 342 families on this machine; local Founder font selection and missing-name fallback verified through browser platform-font inspection |
| Official settings controls | PASS | Gray toolbar scan/arrow buttons, official SVG chevron and primary reset; reset is dark in light mode and white in dark mode |
| Fresh package installation | PASS | Installed the tarball into an isolated profile; client and both OFL files match the build; demo loads this installed candidate |
| Public recordings | PASS | Six real Web GIFs: ASCII light/dark, Hanzi light/dark at 0.8× grid, settings and local font picker in ASCII mode; 960×600, 15 fps; zero page errors |
| Published npm 0.1.1 | PASS | Registry `latest` is 0.1.1 and its tarball SHA-1 matches the release; fresh isolated profile installation and bundle auto-registration pass; runtime, both READMEs and both OFL files match the release |
| Desktop / other browsers | NOT_RUN | No Desktop profile change or restart; no cross-browser claim |

Public recordings use the separate synthetic-data demo environment; private QA captures and token-bearing logs stay under ignored `.local/`. Fine grids combined with many whales or high speeds can be expensive; no frame-rate guarantee is made for those extremes. The native operating-system color-picker popup is not automated.

The report below is historical evidence for 0.1.0, not a substitute for the checks above.

# Published 0.1.0 validation · 2026-10-21

Candidate: `dsh-ascii-whales@0.1.0`, package SHA-1 `d88efd052565962907247b274883ec66691b5201`.

| Layer | Result | Evidence |
| --- | --- | --- |
| TypeScript, build, unit checks | PASS | `npm run check`, 5 tests |
| Real Agent Web | PASS | DSH 0.2.1-rc.2, Edge, isolated `agent-browser-test` profile |
| Both themes | PASS | Live canvas animation, full hero size, neutral glass |
| All 13 settings | PASS | Values, color swatches/picker input, reload persistence, disable and restore |
| Composer | PASS | Draft edit without sending, model menu position, black reset button |
| Lifecycle | PASS | Existing chat hides decoration; new chat restores a single canvas |
| Motion and layout | PASS | Reduced-motion still frame, resumed animation, 640 px resize |
| Packaged installation | PASS | `dsh plugin --profile web add <tgz>` in a fresh isolated home; bundle auto-registration |
| Packaged demo | PASS | Recording environment loads the installed tarball; real light/dark/settings captures |
| Public npm install | PASS | Fresh profile installed `dsh-ascii-whales@0.1.0` from the registry; client SHA-256 matches the tested package |
| Desktop window | NOT_RUN | Desktop profile was not changed or restarted |
| Other browsers / other composer themes | NOT_RUN | No cross-browser or third-party theme compatibility claim |

No browser page errors were observed. Automated color-picker checks set its input and click the visible presets; the operating system's native popup itself is not automated.

Public GIFs and screenshots come from the separate fixture demo environment. Private agent screenshots, logs and token-bearing URLs remain under ignored `.local/`. GIFs use 960×600 at 15 fps; segment metadata is in [media/manifest.json](media/manifest.json).

The pinned upstream source is documented in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md). The integration depends on DSH's current hero/composer DOM attributes; a host update can require an adapter change.
