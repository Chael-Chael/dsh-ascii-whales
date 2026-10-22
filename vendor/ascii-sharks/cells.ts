/** Equal cell area keeps grain density similar while full-width glyphs stay square. */
export function cellSize(width: number, scale: number, square: boolean) {
  const cw = Math.max(1, Math.round(Math.min(13, Math.max(8, Math.round(width / 124))) * scale));
  const ch = Math.round(cw * 1.45);
  const side = Math.max(4, Math.round(Math.sqrt(cw * ch)));
  return square ? [side, side] : [cw, ch];
}
