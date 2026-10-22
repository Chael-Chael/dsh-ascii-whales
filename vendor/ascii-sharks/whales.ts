export const humpback = {
  halfWidth: (s: number) => {
    if (s < 0.12) return 0.115 * Math.pow(Math.sin(s / 0.12 * Math.PI / 2), 0.45);
    if (s < 0.35) return 0.115 + 0.02 * Math.sin((s - 0.12) / 0.23 * Math.PI);
    if (s < 0.87) return 0.018 + 0.097 * Math.pow(1 - (s - 0.35) / 0.52, 1.1);
    return 0.018 * (1 - (s - 0.87) / 0.13);
  },
  pectoral: [0.25, 0.36, 0.41, 0.32] as [number, number, number, number], falcate: false,
  pelvic: [0, 0, 0, 0] as [number, number, number, number], caudal: 0.22,
  dorsal: [0.60, 0.65] as [number, number], secondDorsal: [0, 0] as [number, number],
  eye: [0.10, 0.13] as [number, number], gills: [0, 0] as [number, number], tint: [0.45, 0.65, 1.3] as [number, number, number],
};

export const orca = {
  ...humpback,
  halfWidth: (s: number) => {
    if (s < .14) return .15 * Math.pow(Math.sin(s / .14 * Math.PI / 2), .35);
    if (s < .38) return .15 + .012 * Math.sin((s - .14) / .24 * Math.PI);
    if (s < .88) return .018 + .132 * Math.pow(1 - (s - .38) / .5, 1.3);
    return .018 * (1 - (s - .88) / .12);
  },
  pectoral: [.25, .47, .43, .23] as [number, number, number, number],
  dorsal: [.43, .55] as [number, number],
};

// White eye patches sit behind the eyes; flank patches follow the taper.
export function orcaPatch(s: number, across: number) {
  return ((s - .205) / .067) ** 2 + ((across - .75) / .22) ** 2 < 1
    || ((s - .68) / .12) ** 2 + ((across - .88) / .26) ** 2 < 1;
}

export function orcaFlipper(s: number, distance: number, reach: number) {
  const t = distance / reach;
  return t >= 0 && t <= 1 && ((s - (.31 + .10 * t)) / .085) ** 2 + ((t - .48) / .52) ** 2 <= 1;
}

// Curved, narrow flippers extend sideways, with a rounded taper at the tip.
export function humpbackFlipper(s: number, distance: number, reach: number) {
  const t = distance / reach;
  if (t < 0 || t > 1) return false;
  const center = .29 + .12 * t - .04 * Math.sin(Math.PI * t);
  // A slightly narrower root gives the flipper a soft inset at the flank.
  const root = 1 - .2 * Math.exp(-(((t - .43) / .14) ** 2));
  const width = .05 * (1 - .5 * t) * Math.sqrt(1 - t ** 6) * root;
  return Math.abs(s - center) <= width;
}

// Each curved lobe sweeps behind the tail stock; the inner trailing edge leaves a notch.
export function whaleFlukes(s: number, across: number) {
  const t = across / .22;
  if (t < 0 || t > 1) return false;
  const front = .86 + .12 * t ** 1.7;
  const back = .945 + .035 * t + .028 * Math.sin(Math.PI * t);
  return s >= front && s <= back;
}
