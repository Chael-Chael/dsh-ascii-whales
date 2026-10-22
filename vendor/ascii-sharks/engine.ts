import { AsciiRenderer } from "./renderer";
import { World, type SharkSpec } from "./world";

import { Painter } from "../ascii-kanji-sharks/painter.js";

const STEP = 1 / 60;
const MAX_STEPS = 4;

/**
 * Wires World + AsciiRenderer to a canvas: fixed-timestep loop, resize,
 * pointer input, pausing off-screen, and prefers-reduced-motion.
 */
export class OceanEngine {
  private world: World;
  private renderer: AsciiRenderer | Painter;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private visible = true;
  private reducedMotion: MediaQueryList;
  private resizeObserver: ResizeObserver;
  private intersectionObserver: IntersectionObserver;
  private disposed = false;

  constructor(private canvas: HTMLCanvasElement, sharks?: SharkSpec[], private speed = 1, dark = false, gridScale = 1, gridOpacity = .05, fishCount?: number, wake = 1, color = '#4d6bfe', glyphMode: 'ascii' | 'hanzi' | 'kanji' = 'ascii', colorfulShimmer = false, eyeColor: 'primary' | 'black' | 'white' = 'primary') {
    this.world = new World(sharks, fishCount);
    this.renderer = glyphMode === 'kanji' ? new Painter(canvas, gridScale) : new AsciiRenderer(canvas, dark, gridScale, gridOpacity, wake, glyphMode);
    if (this.renderer instanceof AsciiRenderer) this.renderer.setTheme(dark, gridOpacity, wake, color, colorfulShimmer, eyeColor);
    else this.renderer.setTheme(dark, gridOpacity, wake, color, eyeColor);
    this.renderer.setFontFamily(getComputedStyle(canvas).fontFamily);
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.schedule();
    });
    this.intersectionObserver.observe(canvas);

    this.reducedMotion.addEventListener("change", this.onMotionPreference);
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("pointerdown", this.onPointerDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", this.onPointerLeave);
    window.addEventListener("blur", this.onPointerLeave);
    document.addEventListener("visibilitychange", this.scheduleVisibility);

    this.resize();
    // Canvas text can't trigger a webfont load; redraw the still frame when it arrives.
    document.fonts?.load(`${glyphMode !== 'ascii' ? 400 : 600} 16px ${getComputedStyle(canvas).fontFamily}`, glyphMode !== 'ascii' ? '鲸目鳍尾鮫鰓鰭鰯鰊鯵鯖' : 'S8@').then(() => {
      if (this.disposed) return;
      this.renderer.setFontFamily(getComputedStyle(canvas).fontFamily);
      if (this.reducedMotion.matches) this.drawStill();
    }).catch(() => { /* Canvas keeps the system fallback if font loading is blocked. */ });
    this.schedule();
  }

  destroy() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.reducedMotion.removeEventListener("change", this.onMotionPreference);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerdown", this.onPointerDown);
    document.documentElement.removeEventListener("pointerleave", this.onPointerLeave);
    window.removeEventListener("blur", this.onPointerLeave);
    document.removeEventListener("visibilitychange", this.scheduleVisibility);
  }

  setAppearance(speed: number, dark: boolean, gridOpacity = .05, wake = 1, color = '#4d6bfe', colorfulShimmer = false, eyeColor: 'primary' | 'black' | 'white' = 'primary') {
    this.speed = speed;
    if (this.renderer instanceof AsciiRenderer) this.renderer.setTheme(dark, gridOpacity, wake, color, colorfulShimmer, eyeColor);
    else this.renderer.setTheme(dark, gridOpacity, wake, color, eyeColor);
    if (this.reducedMotion.matches) this.drawStill();
  }

  private scheduleVisibility = () => this.schedule();

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.resize(rect.width, rect.height, dpr);
    this.world.resize(rect.width, rect.height, this.renderer.cellWidth, this.renderer.cellHeight);
    if (this.reducedMotion.matches) this.drawStill();
  }

  private schedule() {
    cancelAnimationFrame(this.raf);
    if (this.disposed || !this.visible || document.hidden || this.reducedMotion.matches) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.acc += dt * this.speed;
    let steps = 0;
    const maxSteps = Math.ceil(MAX_STEPS * Math.max(1, this.speed));
    while (this.acc >= STEP && steps < maxSteps) {
      this.world.step(STEP);
      this.acc -= STEP;
      steps++;
    }
    if (steps === maxSteps) this.acc = 0;
    this.render(dt * this.speed);
    this.raf = requestAnimationFrame(this.frame);
  };

  private render(dt: number) {
    this.renderer.render(this.world, dt);
  }

  /** Reduced motion: let the ecosystem settle, then show a single frame. */
  private drawStill() {
    if (this.world.time < 4) {
      for (let i = 0; i < 240; i++) this.world.step(STEP);
    }
    this.render(STEP);
  }

  private onMotionPreference = () => {
    if (this.reducedMotion.matches) {
      cancelAnimationFrame(this.raf);
      this.drawStill();
    } else {
      this.schedule();
    }
  };

  private toLocal(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    return { x, y, inside };
  }

  private onPointerMove = (e: PointerEvent) => {
    const { x, y, inside } = this.toLocal(e);
    const p = this.world.pointer;
    p.x = x;
    p.y = y;
    p.active = inside && e.pointerType !== "touch";
  };

  private onPointerDown = (e: PointerEvent) => {
    const { x, y, inside } = this.toLocal(e);
    if (inside && !this.reducedMotion.matches) this.world.splash(x, y);
  };

  private onPointerLeave = () => {
    this.world.pointer.active = false;
  };
}
