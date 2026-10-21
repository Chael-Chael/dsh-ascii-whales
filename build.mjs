import { build } from 'esbuild'
import { mkdirSync, copyFileSync } from 'node:fs'
mkdirSync('lib', { recursive: true })
copyFileSync('src/index.js', 'lib/index.js')
await build({
  entryPoints: ['src/client.tsx'], outfile: 'lib/client.js', bundle: true,
  platform: 'browser', format: 'cjs', target: 'es2022', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', '@deepseek-ai/dsh-client-ui-primitives'],
  banner: { js: "/*! Animation adapted from stackedlol/ascii-sharks, commit c521e24a787e6d4cc460d4cf2b9815f25e4fe453. See THIRD_PARTY_NOTICES.md. */\nwindow.__ModuleLoader__.load({ id: 'dsh-ascii-whales', factory: (require) => { var module = { exports: {} }; var exports = module.exports;" },
  footer: { js: 'return module.exports; } });' },
})
