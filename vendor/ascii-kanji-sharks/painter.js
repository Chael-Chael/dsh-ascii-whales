/**
 * Draws the Ocean onto a square grid, one kanji per cell.
 *
 * Whale cells are classified against the body (rounded snout, tapering
 * flank, fins, tail) with five samples per cell. Covered cells take a skin
 * glyph chosen by tone from the ink-measured ramp, or the kanji that names
 * the part they sit on (目 eye, 鰭 fins, 尾 tail). Partly covered
 * cells become a single brush stroke following the outline (一 丨 ノ 丶).
 */
import { cellSize } from "../ascii-sharks/cells.ts";
import { EAT, GlyphAtlas, InkRamp, PART, SFX, SPARK, STROKE, WAKE } from "./glyphs.js";
import { SHARK_NODES as SPINE } from "../ascii-sharks/world.ts";
import { humpback, orca, orcaPatch, orcaFlipper, humpbackFlipper, whaleFlukes } from "../ascii-sharks/whales.ts";
const FISH_GLYPHS = ["鰯", "鰊", "鯵", "鯖", "鰯"];
import { clamp, hash } from "./util.js";

function palette(from, to, steps) {
  const out = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const c = from.map((v, k) => Math.round(v + (to[k] - v) * t));
    out.push(`rgb(${c[0]},${c[1]},${c[2]})`);
  }
  return out;
}

export const THEMES = {
  night: {
    bg: "#03070d",
    vignette: "rgba(0,0,0,0.6)",
    grid: "rgba(120,160,220,0.05)",
    skin: palette([34, 48, 70], [230, 240, 252], 16),
    fill: palette([12, 20, 33], [40, 56, 80], 8),
    fish: palette([48, 64, 88], [176, 196, 222], 8),
    wake: palette([16, 52, 78], [110, 216, 250], 8),
    red: "#ff5b3a",
    eye: "#ffc861",
    glint: "#ffffff",
  },
  paper: {
    bg: "#f1e9d6",
    vignette: "rgba(110,80,40,0.2)",
    grid: "rgba(196,72,52,0.14)",
    skin: palette([196, 188, 172], [16, 15, 14], 16),
    fill: palette([228, 219, 200], [200, 189, 169], 8),
    fish: palette([176, 168, 152], [48, 45, 42], 8),
    wake: palette([206, 206, 196], [64, 100, 140], 8),
    red: "#c4302a",
    eye: "#c4302a",
    glint: "#2f4a8a",
  },
};

const NONE = 0, BODY = 1, DORSAL = 4, PECTORAL = 5, TAIL = 7;
const LAYER_WAKE = 1, LAYER_FISH = 2, LAYER_SHARK = 3;
const SUBSAMPLES = [-0.28, -0.28, 0.28, -0.28, -0.28, 0.28, 0.28, 0.28];
const LIGHT_X = -0.6, LIGHT_Y = -0.8; // from the top-left

const at = (list, tone) => list[Math.round(clamp(tone, 0, 1) * (list.length - 1))];

export class Painter {
  constructor(canvas, gridScale = 1) {
    this.shape = humpback;
    this.gridScale = gridScale;
    // shortcut: keep cells at least 4 px for legibility and raster cost; revisit for finer grids.
    this.cell = cellSize(0, gridScale, true)[0];
    this.wake = 1;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.bg = document.createElement("canvas");
    this.setFontFamily(getComputedStyle(canvas).fontFamily);
    this.theme = THEMES.paper;
    this.cols = 0;
    this.rows = 0;
    this.frame = 0;
    this.touched = [];
    this.fx = [];
    this.spine = new Float32Array(SPINE * 2);
    this.arc = new Float32Array(SPINE);
    this.arcTotal = 1;
    this.finLeft = 0;
    this.finRight = 0;
    // Scratch results of classify(), so the hot loop allocates nothing.
    this.hitS = 0;
    this.hitD = 0;
    this.hitSide = 1;
    this.hitTx = 1;
    this.hitTy = 0;
  }

  setFontFamily(family) {
    this.atlas = new GlyphAtlas(family);
    this.ramp = new InkRamp(family);
    if (this.dpr) this.atlas.setCell(Math.round(this.cell * this.dpr));
  }

  get cellWidth() { return this.cell; }
  get cellHeight() { return this.cell; }

  setTheme(dark, gridOpacity = .05, wake = 1, color = '#4d6bfe', eyeColor = 'primary') {
    this.wake = wake;
    const rgb = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));
    this.theme = { ...THEMES[dark ? 'night' : 'paper'],
      grid: `rgba(128,128,128,${gridOpacity})`,
      eye: eyeColor === 'primary' ? color : eyeColor === 'black' ? '#ffffff' : '#181818',
      eyeFill: eyeColor === 'primary' ? null : eyeColor === 'black' ? '#000000' : '#ffffff',
      skin: palette(rgb.map(v => v * .45), rgb.map(v => v + (255 - v) * .35), 16),
      fill: Array(8).fill(null),
      fish: palette(rgb.map(v => v * .6), rgb, 8),
      wake: palette(rgb.map(v => v * .6), rgb, 8),
    };
    this.paintBackground();
  }

  resize(width, height, dpr) {
    const cell = cellSize(width, this.gridScale, true)[0];
    this.width = width;
    this.height = height;
    this.cell = cell;
    this.dpr = dpr;
    this.cols = Math.ceil(width / cell);
    this.rows = Math.ceil(height / cell);
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.bg.width = this.canvas.width;
    this.bg.height = this.canvas.height;
    this.atlas.setCell(Math.round(cell * dpr));

    const n = this.cols * this.rows;
    this.layer = new Uint8Array(n);
    this.depth = new Float32Array(n);
    this.stamp = new Uint32Array(n);
    this.glyph = new Array(n).fill("");
    this.color = new Array(n).fill("");
    this.fill = new Array(n).fill(null);
    this.alpha = new Float32Array(n);
    this.energy = new Float32Array(n);
    this.energyNext = new Float32Array(n);
    this.touched.length = 0;
    this.fx.length = 0;
    this.paintBackground();
  }

  paintBackground() {
    const g = this.bg.getContext("2d");
    if (!g || !this.cols) return;
    const { theme, cell, dpr } = this;
    const W = this.bg.width;
    const H = this.bg.height;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, W, H);
    // A manuscript-paper grid, one square per character.
    g.strokeStyle = theme.grid;
    g.lineWidth = 1;
    g.beginPath();
    for (let c = 0; c <= this.cols; c++) {
      const x = Math.round(c * cell * dpr) + 0.5;
      g.moveTo(x, 0);
      g.lineTo(x, H);
    }
    for (let r = 0; r <= this.rows; r++) {
      const y = Math.round(r * cell * dpr) + 0.5;
      g.moveTo(0, y);
      g.lineTo(W, y);
    }
    g.stroke();

  }

  render(ocean, dt) {
    if (!this.cols) return;
    this.frame++;
    this.touched.length = 0;
    this.consumeEvents(ocean);
    this.depositWake(ocean, dt);
    for (const sh of ocean.sharks) this.rasterShark(sh, ocean.time);
    this.placeFish(ocean);
    this.placeWake();
    this.draw(ocean.time, dt);
  }

  // ── cells ───────────────────────────────────────────────────────────

  cellAt(x, y) {
    const c = Math.floor(x / this.cell);
    const r = Math.floor(y / this.cell);
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return -1;
    return r * this.cols + c;
  }

  /** Claim a cell; higher layers win, and within a layer the nearer thing wins. */
  put(i, layer, depth, glyph, color, fill = null) {
    if (this.stamp[i] !== this.frame) {
      this.stamp[i] = this.frame;
      this.layer[i] = 0;
      this.touched.push(i);
    } else if (layer < this.layer[i] || (layer === this.layer[i] && depth < this.depth[i])) {
      return;
    }
    this.layer[i] = layer;
    this.depth[i] = depth;
    this.glyph[i] = glyph;
    this.color[i] = color;
    this.fill[i] = fill;
  }

  // ── sharks ──────────────────────────────────────────────────────────

  /** Which part of the current shark (if any) the point lands on. */
  classify(px, py, L) {
    const { spine, arc } = this;
    let best = Infinity;
    let bestS = 0;
    for (let k = 0; k < SPINE - 1; k++) {
      const ax = spine[k * 2];
      const ay = spine[k * 2 + 1];
      const sx = spine[k * 2 + 2] - ax;
      const sy = spine[k * 2 + 3] - ay;
      const len2 = sx * sx + sy * sy || 1;
      const t = clamp(((px - ax) * sx + (py - ay) * sy) / len2, 0, 1);
      const d2 = (px - ax - sx * t) ** 2 + (py - ay - sy * t) ** 2;
      if (d2 < best) {
        best = d2;
        const len = Math.sqrt(len2);
        bestS = (arc[k] + t * len) / this.arcTotal;
        this.hitSide = sx * (py - ay) - sy * (px - ax) >= 0 ? 1 : -1;
        this.hitTx = sx / len;
        this.hitTy = sy / len;
      }
    }
    const d = Math.sqrt(best);
    const s = bestS;
    const w = this.shape.halfWidth(s) * L;
    this.hitS = s;
    this.hitD = d;

    if (d <= w && s <= .945) {
      const across = d / (w || 1);
      if (s > this.shape.dorsal[0] && s < this.shape.dorsal[1] && across < 0.3) return DORSAL;
      return BODY;
    }
    const reach = this.hitSide > 0 ? this.finRight : this.finLeft;
    if (this.shape === orca ? orcaFlipper(s, d, reach) : humpbackFlipper(s, d, reach)) return PECTORAL;
    if (whaleFlukes(s, d / L)) return TAIL;
    return NONE;
  }

  /** The render spine: the sim spine plus a travelling wave that grows toward the tail. */
  buildSpine(sh) {
    this.shape = sh.kind === "orca" ? orca : humpback;
    const { spine, arc } = this;
    const n = sh.nodes;
    const L = sh.length;
    const beat = clamp(sh.speed / 60, 0.4, 1.4);
    for (let k = 0; k < SPINE; k++) {
      const s = k / (SPINE - 1);
      const a = Math.max(0, k - 1);
      const b = Math.min(SPINE - 1, k + 1);
      let tx = n[a * 2] - n[b * 2];
      let ty = n[a * 2 + 1] - n[b * 2 + 1];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      const off = L * 0.05 * (0.1 + 0.9 * Math.pow(s, 1.8)) * beat * Math.sin(sh.phase - s * 5.2);
      spine[k * 2] = n[k * 2] - ty * off;
      spine[k * 2 + 1] = n[k * 2 + 1] + tx * off;
    }
    arc[0] = 0;
    for (let k = 1; k < SPINE; k++) {
      arc[k] = arc[k - 1] + Math.hypot(spine[k * 2] - spine[k * 2 - 2], spine[k * 2 + 1] - spine[k * 2 - 1]);
    }
    this.arcTotal = arc[SPINE - 1] || 1;
    // Bank into turns: the inside fin tucks in, the outside one spreads.
    const bank = clamp(sh.turn * 0.45, -0.35, 0.35);
    const flex = 1 + 0.06 * Math.sin(sh.phase * 0.5);
    this.finRight = L * this.shape.pectoral[3] * flex * (1 - bank);
    this.finLeft = L * this.shape.pectoral[3] * flex * (1 + bank);
  }

  /** One eye per side, each exactly one cell, set on the head after the body is drawn. */
  placeEyes(sh) {
    const { spine, arc } = this;
    const s = 0.10;
    const target = s * this.arcTotal;
    let k = 0;
    while (k < SPINE - 2 && arc[k + 1] < target) k++;
    const seg = arc[k + 1] - arc[k] || 1;
    const t = (target - arc[k]) / seg;
    const tx = (spine[k * 2 + 2] - spine[k * 2]) / seg;
    const ty = (spine[k * 2 + 3] - spine[k * 2 + 1]) / seg;
    const x = spine[k * 2] + (spine[k * 2 + 2] - spine[k * 2]) * t;
    const y = spine[k * 2 + 1] + (spine[k * 2 + 3] - spine[k * 2 + 1]) * t;
    const off = this.shape.halfWidth(s) * sh.length * 0.62;
    for (const side of [-1, 1]) {
      const i = this.cellAt(x - ty * off * side, y + tx * off * side);
      if (i >= 0 && this.stamp[i] === this.frame && this.layer[i] === LAYER_SHARK) {
        this.put(i, LAYER_SHARK, sh.depth, PART.eye, this.theme.eye, this.theme.eyeFill ?? this.fill[i]);
      }
    }
  }

  rasterShark(sh, time) {
    const { cell, cols, rows, spine, theme, ramp } = this;
    const L = sh.length;
    this.buildSpine(sh);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let k = 0; k < SPINE; k++) {
      minX = Math.min(minX, spine[k * 2]);
      maxX = Math.max(maxX, spine[k * 2]);
      minY = Math.min(minY, spine[k * 2 + 1]);
      maxY = Math.max(maxY, spine[k * 2 + 1]);
    }
    const reach = Math.max(L * 0.3, this.finLeft, this.finRight);
    const c0 = Math.max(0, Math.floor((minX - reach) / cell));
    const c1 = Math.min(cols - 1, Math.floor((maxX + reach) / cell));
    const r0 = Math.max(0, Math.floor((minY - reach) / cell));
    const r1 = Math.min(rows - 1, Math.floor((maxY + reach) / cell));
    const skip = reach + cell;
    const dim = 0.6 + 0.4 * sh.depth;

    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const x = (c + 0.5) * cell;
        const y = (r + 0.5) * cell;
        const part = this.classify(x, y, L);
        if (part === NONE && this.hitD > skip) continue;
        const s = this.hitS;
        const d = this.hitD;
        const side = this.hitSide;
        const tx = this.hitTx;
        const ty = this.hitTy;

        let hits = part === NONE ? 0 : 1;
        for (let k = 0; k < SUBSAMPLES.length; k += 2) {
          if (this.classify(x + SUBSAMPLES[k] * cell, y + SUBSAMPLES[k + 1] * cell, L) !== NONE) hits++;
        }
        if (hits === 0) continue;
        const coverage = hits / 5;
        const i = r * cols + c;
        // Anchored to the body, so a glyph rides along with its patch of skin.
        const key = Math.floor(hash(Math.round((s * L) / cell), Math.round((side * d) / cell), sh.id) * 1e9);

        if (part === NONE || coverage < 0.6) {
          this.put(i, LAYER_SHARK, sh.depth, this.stroke(tx, ty), at(theme.skin, (0.2 + 0.3 * coverage) * dim));
          continue;
        }

        let glyph;
        let tone;
        let color = null;
        if (part === BODY) {
          const across = d / (this.shape.halfWidth(s) * L || 1);
          const facing = (-ty * side * LIGHT_X + tx * side * LIGHT_Y) * across;
          // Heavy kanji down the spine, light strokes toward the flanks: the
          // drop-off is what rounds the body.
          tone = 1 - 0.95 * Math.pow(across, 1.6) + 0.18 * facing + ((key % 7) - 3) * 0.02;
          glyph = ramp.pick(tone);
          if (tone > 0.55 && key % 23 === 0) glyph = PART.name;
          // Scales catch the light now and then, each on its own clock.
          if (tone > 0.45 && hash(key, Math.floor(time * 2.5), 3) < 0.025) color = theme.glint;

        } else if (part === DORSAL) {
          glyph = PART.fin;
          tone = 1;
        } else if (part === PECTORAL) {
          glyph = PART.fin;
          const finReach = side > 0 ? this.finRight : this.finLeft;
          tone = 0.42 + 0.25 * (1 - clamp(d / finReach, 0, 1));

        } else {
          glyph = PART.tail;
          tone = 0.55;
        }
        color ??= at(theme.skin, tone * dim);
        const patch = this.shape === orca && part === BODY && orcaPatch(s, d / (this.shape.halfWidth(s) * L || 1));
        this.put(i, LAYER_SHARK, sh.depth, glyph, patch ? '#181818' : color, patch ? '#f5f5f0' : at(theme.fill, tone * dim));
      }
    }
    this.placeEyes(sh);
  }

  /** One brush stroke along the outline's on-screen direction. */
  stroke(tx, ty) {
    let a = Math.atan2(ty, tx);
    if (a < 0) a += Math.PI;
    const deg = (a * 180) / Math.PI;
    if (deg < 22.5 || deg >= 157.5) return STROKE.flat;
    if (deg < 67.5) return STROKE.down; // screen y points down, so this leans like "\"
    if (deg < 112.5) return STROKE.upright;
    return STROKE.up;
  }

  // ── fish & water ────────────────────────────────────────────────────

  placeFish(ocean) {
    const { theme } = this;
    for (const f of ocean.fish) {
      if (!f.alive) continue;
      const i = this.cellAt(f.x, f.y);
      if (i < 0) continue;
      const tone = 0.2 + 0.6 * ((f.depth - 0.5) / 0.5) + 0.35 * f.alarm;
      this.put(i, LAYER_FISH, f.depth, FISH_GLYPHS[f.species], at(theme.fish, tone));
    }
  }

  depositWake(ocean, dt) {
    const { energy } = this;
    const u = this.cell;
    for (const f of ocean.fish) {
      if (!f.alive) continue;
      const i = this.cellAt(f.x, f.y);
      if (i >= 0) energy[i] = Math.min(1.5, energy[i] + 0.008 + f.alarm * 0.025);
    }
    for (const sh of ocean.sharks) {
      for (let k = SPINE - 5; k < SPINE; k++) {
        const i = this.cellAt(sh.nodes[k * 2], sh.nodes[k * 2 + 1]);
        if (i >= 0) energy[i] = Math.min(1.5, energy[i] + 0.05 + (sh.speed / u) * 0.004);
      }
    }
    if (ocean.pointer.active) this.splashEnergy(ocean.pointer.x, ocean.pointer.y, 1, 0.06);

    // Blur and fade, so wakes spread like ripples and die away.
    const { cols, rows, energyNext: next } = this;
    const fade = Math.exp(-dt * 1.4);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const e = energy[i];
        const l = c > 0 ? energy[i - 1] : e;
        const rt = c < cols - 1 ? energy[i + 1] : e;
        const up = r > 0 ? energy[i - cols] : e;
        const dn = r < rows - 1 ? energy[i + cols] : e;
        next[i] = (e * 4 + l + rt + up + dn) * 0.125 * fade;
      }
    }
    this.energyNext = energy;
    this.energy = next;
  }

  splashEnergy(x, y, radius, amount) {
    const c0 = Math.floor(x / this.cell);
    const r0 = Math.floor(y / this.cell);
    for (let r = r0 - radius; r <= r0 + radius; r++) {
      for (let c = c0 - radius; c <= c0 + radius; c++) {
        if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) continue;
        const d = Math.hypot(c - c0, r - r0);
        if (d > radius + 0.5) continue;
        const i = r * this.cols + c;
        this.energy[i] = Math.min(1.5, this.energy[i] + amount * (1 - d / (radius + 1)));
      }
    }
  }

  placeWake() {
    const { energy, theme } = this;
    for (let i = 0; i < energy.length; i++) {
      const e = energy[i] * this.wake;
      if (e < 0.3) continue;
      if (this.stamp[i] === this.frame) continue; // something is already here
      const glyph = e > 0.95 ? WAKE[2] : e > 0.6 ? WAKE[1] : WAKE[0];
      this.put(i, LAYER_WAKE, 0, glyph, at(theme.wake, (e - 0.3) / 0.9));
    }
  }

  // ── effects ─────────────────────────────────────────────────────────

  consumeEvents(ocean) {
    const { cell } = this;
    // Text effects stay within fully visible cells (the last row/column may be cut off).
    const cols = Math.floor(this.width / cell);
    const rows = Math.floor(this.height / cell);
    for (const e of ocean.events) {
      const col = Math.floor(e.x / cell);
      const row = Math.floor(e.y / cell);
      if (e.kind === "eat") {
        this.addFx(col, row, EAT, 0, 0.9);
        for (const [dc, dr] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) this.addFx(col + dc, row + dr, SPARK, 0.04, 0.45);
        this.splashEnergy(e.x, e.y, 2, 0.8);
        const text = [...SFX.chomp];
        const start = clamp(col + 1, 0, cols - text.length);
        const r = clamp(row - 1, 0, rows - 1);
        text.forEach((ch, k) => this.addFx(start + k, r, ch, k * 0.06, 1.2));
      } else if (e.kind === "splash") {
        const text = [...SFX.splash];
        const start = clamp(col - 1, 0, cols - text.length);
        const r = clamp(row - 2, 0, rows - 1);
        text.forEach((ch, k) => this.addFx(start + k, r, ch, k * 0.06, 1));
        this.splashEnergy(e.x, e.y, 5, 1.4);
      }
    }
    ocean.events.length = 0;
  }

  addFx(col, row, glyph, delay, life) {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return;
    this.fx.push({ col, row, glyph, age: -delay, life });
  }

  // ── output ──────────────────────────────────────────────────────────

  draw(time, dt) {
    const { ctx, atlas, cell, dpr, cols, touched } = this;
    const px = atlas.px;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.bg, 0, 0);

    for (const i of touched) {
      const x = Math.round((i % cols) * cell * dpr);
      const y = Math.round(((i / cols) | 0) * cell * dpr);
      const fill = this.fill[i];
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fillRect(x + 1, y + 1, px - 1, px - 1);
      }
      ctx.drawImage(atlas.get(this.glyph[i], this.color[i]), x, y);
    }

    const red = this.theme.red;
    let live = 0;
    for (const f of this.fx) {
      f.age += dt;
      if (f.age >= f.life) continue;
      this.fx[live++] = f;
      if (f.age < 0) continue;
      const x = Math.round(f.col * cell * dpr);
      const y = Math.round(f.row * cell * dpr);
      ctx.globalAlpha = 1 - (f.age / f.life) ** 2;
      ctx.clearRect(x, y, px, px);
      ctx.drawImage(atlas.get(f.glyph, red), x, y);
    }
    this.fx.length = live;
    ctx.globalAlpha = 1;
  }
}
