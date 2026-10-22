/** Equal cell area keeps grain density similar while full-width glyphs stay square. */
export function cellSize(scale: number, square: boolean) {
  const cw = Math.max(1, Math.round(8 * scale));
  const ch = Math.round(cw * 1.45);
  const side = Math.max(4, Math.round(Math.sqrt(cw * ch)));
  return square ? [side, side] : [cw, ch];
}
