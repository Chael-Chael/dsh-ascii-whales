# 0.1.0 validation · 2026-10-21

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
