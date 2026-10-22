/**
 * The kanji vocabulary, the web font that draws it, and an ink-measured ramp.
 *
 * The shading ramp is not hand-ordered: every candidate is drawn once at load
 * and its ink coverage counted, so "denser glyph = darker/brighter cell" holds
 * for whatever font actually rendered.
 */

export const FONT_FAMILY = '"Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho ProN", serif';

/** Skin candidates, light strokes to heavy sea/fish kanji. Sorted by measured ink at load. */
const SKIN_POOL = "丶ノ一二小川水氷永汐泳波海浪潮濤鯨";

export const PART = {
  eye: "目",
  fin: "鰭",
  tail: "尾",
  scale: "鱗",
  name: "鯨",
};

/** Outline strokes by the outline's on-screen direction. */
export const STROKE = { flat: "一", upright: "丨", down: "丶", up: "ノ" };

export const WAKE = ["、", "〜", "氵"];
export const EAT = "喰";
export const SPARK = "丶";
export const SFX = { chomp: "ガブッ", splash: "ザバッ" };

const fontCss = (px, family) => `400 ${px}px ${family}`;

function measureInk(chars, family) {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.font = fontCss(size * 0.9, family);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "#fff";
  return [...chars].map((ch) => {
    g.clearRect(0, 0, size, size);
    g.fillText(ch, size / 2, size / 2);
    const data = g.getImageData(0, 0, size, size).data;
    let sum = 0;
    for (let i = 3; i < data.length; i += 4) sum += data[i];
    return { ch, ink: sum / (255 * size * size) };
  });
}

/**
 * Glyph lookup by tone in [0, 1]. Tones are spread evenly over the measured
 * ink range so the lightest and heaviest candidates both get used.
 */
export class InkRamp {
  constructor(family, chars = SKIN_POOL) {
    const measured = measureInk(chars, family).sort((a, b) => a.ink - b.ink);
    const lo = measured[0].ink;
    const hi = measured[measured.length - 1].ink || 1;
    this.entries = measured.map((m) => ({ ch: m.ch, tone: (m.ink - lo) / (hi - lo || 1) }));
    this.table = [];
    const steps = 64;
    for (let i = 0; i < steps; i++) {
      const tone = i / (steps - 1);
      let best = this.entries[0];
      for (const e of this.entries) if (Math.abs(e.tone - tone) < Math.abs(best.tone - tone)) best = e;
      this.table.push(best.ch);
    }
  }

  pick(tone) {
    const i = Math.round(Math.min(1, Math.max(0, tone)) * (this.table.length - 1));
    return this.table[i];
  }
}

/**
 * Pre-rendered glyph tiles keyed by glyph + colour, blitted with drawImage.
 * Colours come from small quantised palettes, so the cache stays bounded.
 */
export class GlyphAtlas {
  constructor(family) {
    this.family = family;
    this.tiles = new Map();
    this.px = 0;
  }

  setCell(cellPx) {
    if (cellPx === this.px) return;
    this.px = cellPx;
    this.tiles.clear();
    const g = document.createElement("canvas").getContext("2d");
    g.font = fontCss(Math.round(cellPx * 0.86), this.family);
    // Centre on a full-height reference kanji so every glyph shares one baseline.
    const m = g.measureText("国");
    this.baseline = cellPx / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  }

  get(glyph, color) {
    const key = glyph + color;
    let tile = this.tiles.get(key);
    if (tile) return tile;
    if (this.tiles.size > 6000) this.tiles.clear();
    const px = this.px;
    tile = document.createElement("canvas");
    tile.width = tile.height = px;
    const g = tile.getContext("2d");
    g.font = fontCss(Math.round(px * 0.86), this.family);
    g.textAlign = "center";
    g.textBaseline = "alphabetic";
    g.fillStyle = color;
    g.fillText(glyph, px / 2, this.baseline);
    this.tiles.set(key, tile);
    return tile;
  }
}
