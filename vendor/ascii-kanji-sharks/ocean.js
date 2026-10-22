/**
 * The simulation, in pixels but tuned in grid cells (u), so it behaves the
 * same at any cell size.
 *
 * Fish: boids (separation / alignment / cohesion) with a blind spot behind
 * each fish. Fear spreads from fish to fish, so a school bolts as one, and a
 * fleeing fish breaks to its own side of the shark's path.
 *
 * Sharks: a chain of spine points dragged by the snout. Each patrols its own
 * slow Lissajous route; as hunger builds it hunts, preferring fish away from
 * the crowd. Eaten fish return later as a fresh school from the edge.
 */
import { TAU, clamp, turnTo } from "./util.js";

export const SPINE = 16;

// Speeds in cells/s, accelerations scale with the cell size too.
export const SPECIES = [
  { glyph: "鰯", odds: 4, school: [18, 30], cruise: 2.2, top: 4.2, align: 1.6, cohere: 1.5, sep: 1.15, jitter: 3, level: 0.8, mill: 3.2 },
  { glyph: "鰊", odds: 3, school: [14, 24], cruise: 2.7, top: 4.8, align: 2.8, cohere: 0.5, sep: 1.2, jitter: 2, level: 1.6, mill: 0 },
  { glyph: "鯵", odds: 2, school: [8, 14], cruise: 2.1, top: 4.2, align: 1.6, cohere: 1.0, sep: 1.45, jitter: 2.4, level: 1.8, mill: 0 },
  { glyph: "鯖", odds: 1, school: [5, 9], cruise: 1.8, top: 4.0, align: 1.3, cohere: 0.8, sep: 1.8, jitter: 1.8, level: 2.2, mill: 0 },
];
const TOTAL_ODDS = SPECIES.reduce((sum, s) => sum + s.odds, 0);

const SEPARATION = 28;
const FLEE = 70;
const BLIND = -0.55; // cos of the edge of the blind cone behind a fish
const SHARK_SIZES = [1, .7, .84, .77, .65, .9];

export class Ocean {
  constructor(random, sharkCount, fishCount = 170, size = 1) {
    this.fishCount = fishCount;
    this.size = size;
    this.random = random;
    this.sharkCount = clamp(sharkCount, 0, 20);
    this.width = 0;
    this.height = 0;
    this.u = 18;
    this.time = 0;
    this.fish = [];
    this.sharks = [];
    /** Things the view reacts to: eat / chomp / splash. Drained by the painter. */
    this.events = [];
    this.pointer = { x: 0, y: 0, active: false };
    this.lastSpawn = 0;
    this.grid = { cols: 0, rows: 0, size: 1, head: new Int32Array(0), count: new Uint16Array(0), next: new Int32Array(0) };
  }

  resize(width, height, u) {
    const first = this.width === 0;
    this.width = width;
    this.height = height;
    this.u = u;
    if (first) {
      this.seed();
      return;
    }
    for (const f of this.fish) {
      f.x = clamp(f.x, 0, width);
      f.y = clamp(f.y, 0, height);
    }
  }

  pickSpecies() {
    let r = this.random() * TOTAL_ODDS;
    for (let i = 0; i < SPECIES.length; i++) {
      r -= SPECIES[i].odds;
      if (r <= 0) return i;
    }
    return 0;
  }

  seed() {
    const { width: W, height: H, u, random } = this;
    const minSide = Math.min(W, H);
    const base = clamp(minSide * 0.72, 16 * u, 56 * u);

    this.sharks = [];
    for (let i = 0; i < this.sharkCount; i++) {
      const size = SHARK_SIZES[i % SHARK_SIZES.length];
      const L = base * size * this.size;
      const x = random.range(0.15, 0.85) * W;
      const y = random.range(0.15, 0.85) * H;
      const heading = random.range(0, TAU);
      const nodes = new Float32Array(SPINE * 2);
      const seg = L / (SPINE - 1);
      for (let k = 0; k < SPINE; k++) {
        nodes[k * 2] = x - Math.cos(heading) * seg * k;
        nodes[k * 2 + 1] = y - Math.sin(heading) * seg * k;
      }
      this.sharks.push({
        id: i + 1,
        L,
        depth: size,
        nodes,
        heading,
        speed: 2 * u,
        phase: random.range(0, TAU),
        turn: 0,
        hunger: random.range(0.2, 0.7),
        wander: 0,
        target: null,
        retargetAt: 0,
        lastChomp: -10,
        // Each shark's own patrol route: a slow Lissajous figure over the screen.
        route: {
          ax: random.range(0.18, 0.3), ay: random.range(0.14, 0.26),
          fx: random.range(0.012, 0.022), fy: random.range(0.017, 0.03),
          px: random.range(0, TAU), py: random.range(0, TAU),
        },
      });
    }
    // Smaller = farther: drawn first, so the biggest swims over the rest.
    this.sharks.sort((a, b) => a.L - b.L);

    const total = this.fishCount;
    this.fish = [];
    while (this.fish.length < total) {
      const species = this.pickSpecies();
      const sp = SPECIES[species];
      const n = Math.min(random.int(sp.school[0], sp.school[1]), total - this.fish.length);
      const cx = random.range(0.08, 0.92) * W;
      const cy = random.range(0.1, 0.9) * H;
      const dir = (random() < 0.5 ? 0 : Math.PI) + random.range(-0.4, 0.4);
      const millDir = random.sign();
      const spread = Math.sqrt(n) * sp.sep * u;
      for (let k = 0; k < n; k++) {
        this.fish.push({
          x: cx + random.range(-1, 1) * spread,
          y: cy + random.range(-0.6, 0.6) * spread,
          vx: Math.cos(dir) * sp.cruise * u,
          vy: Math.sin(dir) * sp.cruise * u,
          species,
          alarm: 0,
          alive: true,
          respawnAt: 0,
          depth: random.range(0.5, 1),
          millDir,
        });
      }
    }
  }

  splash(x, y) {
    this.events.push({ type: "splash", x, y });
    const r = 14 * this.u;
    for (const f of this.fish) {
      if (!f.alive) continue;
      const dx = f.x - x;
      const dy = f.y - y;
      const d = Math.hypot(dx, dy);
      if (d > r || d < 1e-3) continue;
      const kick = (1 - d / r) * 16 * this.u;
      f.vx += (dx / d) * kick;
      f.vy += (dy / d) * kick;
      f.alarm = 1;
    }
  }

  step(dt) {
    this.time += dt;
    this.buildGrid();
    this.stepFish(dt);
    this.stepSharks(dt);
    this.respawn();
  }

  // ── fish ────────────────────────────────────────────────────────────

  buildGrid() {
    const g = this.grid;
    g.size = 4 * this.u;
    g.cols = Math.ceil(this.width / g.size) + 2;
    g.rows = Math.ceil(this.height / g.size) + 2;
    const n = g.cols * g.rows;
    if (g.head.length !== n) {
      g.head = new Int32Array(n);
      g.count = new Uint16Array(n);
    }
    if (g.next.length !== this.fish.length) g.next = new Int32Array(this.fish.length);
    g.head.fill(-1);
    g.count.fill(0);
    for (let i = 0; i < this.fish.length; i++) {
      const f = this.fish[i];
      if (!f.alive) continue;
      const b = this.bucket(f.x, f.y);
      g.next[i] = g.head[b];
      g.head[b] = i;
      g.count[b]++;
    }
  }

  bucket(x, y) {
    const g = this.grid;
    const c = clamp(Math.floor(x / g.size) + 1, 0, g.cols - 1);
    const r = clamp(Math.floor(y / g.size) + 1, 0, g.rows - 1);
    return r * g.cols + c;
  }

  stepFish(dt) {
    const { fish, sharks, pointer, u, random, grid } = this;
    const W = this.width;
    const H = this.height;
    const R = grid.size;
    const R2 = R * R;
    const foreignR = 2.5 * u;
    const calm = Math.exp(-dt * 0.7);
    const relay = Math.min(1, dt * 6);

    for (let i = 0; i < fish.length; i++) {
      const f = fish[i];
      if (!f.alive) continue;
      const sp = SPECIES[f.species];
      const sepR = sp.sep * u * (1 + 1.6 * f.alarm);
      const speed = Math.hypot(f.vx, f.vy) || 1e-6;
      const hx = f.vx / speed;
      const hy = f.vy / speed;

      let sx = 0, sy = 0, avx = 0, avy = 0, cx = 0, cy = 0, n = 0;
      let loudest = 0;
      const bc = clamp(Math.floor(f.x / R) + 1, 0, grid.cols - 1);
      const br = clamp(Math.floor(f.y / R) + 1, 0, grid.rows - 1);
      for (let r = Math.max(0, br - 1); r <= Math.min(grid.rows - 1, br + 1); r++) {
        for (let c = Math.max(0, bc - 1); c <= Math.min(grid.cols - 1, bc + 1); c++) {
          for (let j = grid.head[r * grid.cols + c]; j !== -1; j = grid.next[j]) {
            if (j === i) continue;
            const o = fish[j];
            const dx = o.x - f.x;
            const dy = o.y - f.y;
            const d2 = dx * dx + dy * dy;
            if (d2 >= R2 || d2 < 1e-6) continue;
            const d = Math.sqrt(d2);
            if (dx * hx + dy * hy < BLIND * d) continue;
            if (d < sepR) {
              const k = (1 - d / sepR) / d;
              sx -= dx * k;
              sy -= dy * k;
            }
            if (o.species === f.species) {
              avx += o.vx;
              avy += o.vy;
              cx += dx;
              cy += dy;
              n++;
            } else if (d < foreignR) {
              const k = ((1 - d / foreignR) / d) * 0.5;
              sx -= dx * k;
              sy -= dy * k;
            }
            if (o.alarm > loudest) loudest = o.alarm;
          }
        }
      }

      let ax = sx * SEPARATION * u;
      let ay = sy * SEPARATION * u;
      if (n > 0) {
        const cohere = sp.cohere * (1 - 0.8 * f.alarm);
        ax += (avx / n - f.vx) * sp.align + (cx / n) * cohere;
        ay += (avy / n - f.vy) * sp.align + (cy / n) * cohere;
        if (sp.mill > 0) {
          // Circle the local centre: sardines wind themselves into a bait ball.
          const cl = Math.hypot(cx, cy) || 1;
          const k = sp.mill * u * f.millDir * (1 - f.alarm);
          ax += (-cy / cl) * k;
          ay += (cx / cl) * k;
        }
      }

      let fear = 0;
      for (const sh of sharks) {
        const fearR = sh.L * 0.32 + 3 * u;
        let best = Infinity, bx = 0, by = 0;
        for (let k = 0; k <= 8; k += 2) {
          const nx = sh.nodes[k * 2];
          const ny = sh.nodes[k * 2 + 1];
          const d2 = (f.x - nx) ** 2 + (f.y - ny) ** 2;
          if (d2 < best) {
            best = d2;
            bx = nx;
            by = ny;
          }
        }
        const d = Math.sqrt(best);
        if (d >= fearR || d < 1e-3) continue;
        const w = (1 - d / fearR) ** 2;
        // Break sideways, away from the line the shark is swimming along.
        const shx = Math.cos(sh.heading);
        const shy = Math.sin(sh.heading);
        const side = shx * (f.y - sh.nodes[1]) - shy * (f.x - sh.nodes[0]) >= 0 ? 1 : -1;
        ax += (((f.x - bx) / d) * 0.6 - shy * side * 0.9) * FLEE * u * w;
        ay += (((f.y - by) / d) * 0.6 + shx * side * 0.9) * FLEE * u * w;
        fear = Math.max(fear, Math.sqrt(w));
      }

      if (pointer.active) {
        const pr = 7 * u;
        const dx = f.x - pointer.x;
        const dy = f.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < pr && d > 1e-3) {
          const w = (1 - d / pr) ** 2;
          ax += (dx / d) * FLEE * u * w;
          ay += (dy / d) * FLEE * u * w;
          fear = Math.max(fear, Math.sqrt(w) * 0.8);
        }
      }

      let alarm = Math.max(f.alarm * calm, fear);
      const passed = loudest * 0.85;
      if (passed > alarm) alarm += (passed - alarm) * relay;
      f.alarm = alarm;

      const m = 1.5 * u;
      if (f.x < m) ax += (m - f.x) * 6;
      else if (f.x > W - m) ax -= (f.x - (W - m)) * 6;
      if (f.y < m) ay += (m - f.y) * 6;
      else if (f.y > H - m) ay -= (f.y - (H - m)) * 6;

      ax += (random() - 0.5) * sp.jitter * 2 * u;
      ay += (random() - 0.5) * sp.jitter * 2 * u;
      // Fish swim level unless they are bolting.
      ay -= f.vy * sp.level * (1 - 0.7 * alarm);

      const preferred = sp.cruise * u * (1 + 1.4 * alarm);
      ax += (preferred - speed) * hx * 1.6;
      ay += (preferred - speed) * hy * 1.6;

      f.vx += ax * dt;
      f.vy += ay * dt;
      const top = sp.top * u * (1 + 1.1 * alarm);
      const low = sp.cruise * u * 0.45;
      const s = Math.hypot(f.vx, f.vy);
      if (s > top) {
        f.vx *= top / s;
        f.vy *= top / s;
      } else if (s < low && s > 1e-6) {
        f.vx *= low / s;
        f.vy *= low / s;
      }
      f.x = clamp(f.x + f.vx * dt, -3 * u, W + 3 * u);
      f.y = clamp(f.y + f.vy * dt, -3 * u, H + 3 * u);
    }
  }

  // ── sharks ──────────────────────────────────────────────────────────

  stepSharks(dt) {
    const { sharks, u, random, time } = this;
    const W = this.width;
    const H = this.height;

    for (const sh of sharks) {
      const L = sh.L;
      const nodes = sh.nodes;
      const hx = nodes[0];
      const hy = nodes[1];
      sh.hunger = Math.min(1, sh.hunger + dt * 0.035);

      let dx = Math.cos(sh.heading);
      let dy = Math.sin(sh.heading);

      sh.wander = clamp(sh.wander + (random() - 0.5) * dt * 3, -1, 1);
      dx += Math.cos(sh.heading + sh.wander) * 0.4;
      dy += Math.sin(sh.heading + sh.wander) * 0.4;

      if (time >= sh.retargetAt) {
        sh.target = this.findPrey(sh);
        sh.retargetAt = time + 0.4;
      }
      const t = sh.target;
      let hunting = false;
      let closing = 0;
      if (t && t.alive && sh.hunger > 0.35) {
        const tx = t.x + t.vx * 0.3 - hx;
        const ty = t.y + t.vy * 0.3 - hy;
        const d = Math.hypot(tx, ty) || 1;
        const w = 1.3 + 2.4 * sh.hunger;
        dx += (tx / d) * w;
        dy += (ty / d) * w;
        hunting = true;
        closing = clamp(1 - d / (L * 0.8), 0, 1);
      } else {
        const r = sh.route;
        const wx = W / 2 + W * r.ax * Math.sin(time * r.fx * TAU + r.px);
        const wy = H / 2 + H * r.ay * Math.sin(time * r.fy * TAU + r.py);
        const d = Math.hypot(wx - hx, wy - hy) || 1;
        dx += ((wx - hx) / d) * 0.7;
        dy += ((wy - hy) / d) * 0.7;
      }

      for (const other of sharks) {
        if (other === sh) continue;
        const range = (L + other.L) * 0.35;
        for (let k = 0; k < SPINE; k += 3) {
          const ox = hx - other.nodes[k * 2];
          const oy = hy - other.nodes[k * 2 + 1];
          const d = Math.hypot(ox, oy);
          if (d < range && d > 1e-3) {
            const w = (1 - d / range) * 2.5;
            dx += (ox / d) * w;
            dy += (oy / d) * w;
          }
        }
      }

      // The snout may poke off-screen a little, then it's steered home.
      const slack = L * 0.08;
      const over = Math.max(-slack - hx, hx - W - slack, -slack - hy, hy - H - slack);
      if (over > -L * 0.15) {
        const w = clamp((over + L * 0.15) / (L * 0.3), 0, 1) * 3.5;
        const toX = W / 2 - hx;
        const toY = H / 2 - hy;
        const d = Math.hypot(toX, toY) || 1;
        dx += (toX / d) * w;
        dy += (toY / d) * w;
      }

      // Turning circle widens with speed: sharks can't pivot on the spot.
      const agility = Math.min(hunting ? 1.6 + 1.2 * closing : 0.75, sh.speed / (L * 0.12));
      const turned = clamp(turnTo(sh.heading, Math.atan2(dy, dx)), -agility * dt, agility * dt);
      sh.heading += turned;
      sh.turn += (turned / dt - sh.turn) * Math.min(1, dt * 3);

      const cruise = 1.6 * u + L * 0.025;
      // A burst of speed for the final lunge.
      const want = hunting ? cruise * (1.5 + 2.2 * closing) : cruise;
      sh.speed += (want - sh.speed) * Math.min(1, dt * 1.2);
      sh.phase += dt * (1.8 + sh.speed / (1.4 * u));

      nodes[0] += Math.cos(sh.heading) * sh.speed * dt;
      nodes[1] += Math.sin(sh.heading) * sh.speed * dt;

      // Drag the spine along, limiting each joint's bend so the body curves
      // into a C at most and never folds over.
      const seg = L / (SPINE - 1);
      let prev = sh.heading + Math.PI;
      for (let k = 1; k < SPINE; k++) {
        const px = nodes[(k - 1) * 2];
        const py = nodes[(k - 1) * 2 + 1];
        let a = Math.atan2(nodes[k * 2 + 1] - py, nodes[k * 2] - px);
        a = prev + clamp(turnTo(prev, a), -0.2, 0.2);
        nodes[k * 2] = px + Math.cos(a) * seg;
        nodes[k * 2 + 1] = py + Math.sin(a) * seg;
        prev = a;
      }

      if (sh.hunger > 0.12) {
        const mouth = L * 0.06 + 0.6 * u;
        const mx = nodes[0];
        const my = nodes[1];
        for (const f of this.fish) {
          if (!f.alive || (f.x - mx) ** 2 + (f.y - my) ** 2 > mouth * mouth) continue;
          f.alive = false;
          f.respawnAt = time + random.range(3, 8);
          sh.hunger = Math.max(0, sh.hunger - 0.18);
          this.events.push({ type: "eat", x: f.x, y: f.y });
          if (time - sh.lastChomp > 3) {
            sh.lastChomp = time;
            this.events.push({ type: "chomp", x: mx, y: my, heading: sh.heading, L });
          }
        }
      }
    }
  }

  /** Fish in the forward cone, preferring near ones away from the crowd. */
  findPrey(sh) {
    const range = sh.L * 0.8 + 8 * this.u;
    const hx = sh.nodes[0];
    const hy = sh.nodes[1];
    const fx = Math.cos(sh.heading);
    const fy = Math.sin(sh.heading);
    let best = null;
    let bestScore = Infinity;
    let keepScore = Infinity;
    for (const f of this.fish) {
      if (!f.alive) continue;
      const dx = f.x - hx;
      const dy = f.y - hy;
      const d = Math.hypot(dx, dy);
      if (d > range || d < 1e-3) continue;
      const cos = (dx * fx + dy * fy) / d;
      if (cos < 0.25) continue;
      const crowd = this.grid.count[this.bucket(f.x, f.y)];
      const score = d * (2 - cos) * (1 + crowd * 0.08);
      if (score < bestScore) {
        bestScore = score;
        best = f;
      }
      if (f === sh.target) keepScore = score;
    }
    if (sh.target && keepScore < bestScore * 1.25) return sh.target;
    return best;
  }

  respawn() {
    const { time, random, u } = this;
    const W = this.width;
    const H = this.height;
    const due = this.fish.filter((f) => !f.alive && f.respawnAt <= time);
    if (due.length === 0) return;
    if (due.length < 6 && time - this.lastSpawn < 8) return;
    this.lastSpawn = time;

    const side = random.int(0, 3);
    const along = random.range(0.15, 0.85);
    const x = side === 0 ? -2 * u : side === 1 ? W + 2 * u : along * W;
    const y = side === 2 ? -2 * u : side === 3 ? H + 2 * u : along * H;
    const inward = Math.atan2(H / 2 - y, W / 2 - x) + random.range(-0.5, 0.5);
    const species = this.pickSpecies();
    const sp = SPECIES[species];
    const millDir = random.sign();
    for (const f of due.slice(0, sp.school[1])) {
      f.alive = true;
      f.species = species;
      f.alarm = 0;
      f.millDir = millDir;
      f.x = x + random.range(-3, 3) * u;
      f.y = y + random.range(-3, 3) * u;
      f.vx = Math.cos(inward) * sp.cruise * u * 1.4;
      f.vy = Math.sin(inward) * sp.cruise * u * 1.4;
    }
  }
}
