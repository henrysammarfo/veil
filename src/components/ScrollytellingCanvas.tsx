import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * Scroll-driven frame background.
 *
 * The 181 JPG frames in /public/frames act as the "video". The scrub maps
 * window scroll across the ENTIRE document — frame 1 at the very top,
 * frame 181 exactly when you reach the end of the footer:
 *
 *   fraction = scrollY / (document.scrollHeight - innerHeight)
 *
 * Drawing happens inside a continuous requestAnimationFrame loop with a
 * "drawn frame" guard — we only repaint when the target frame actually
 * changes, the canvas equivalent of the `!video.seeking` check: never queue
 * a new paint while the previous one is in flight.
 */

const FRAME_COUNT = 181;
const EAGER_COUNT = 24;

const framePath = (index: number) =>
  `/frames/ezgif-frame-${String(index + 1).padStart(3, "0")}.jpg`;

type Slot = { img: HTMLImageElement | null; done: boolean };

export function ScrollytellingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const slotsRef = useRef<Slot[]>(
    Array.from({ length: FRAME_COUNT }, () => ({ img: null, done: false })),
  );
  const drawnRef = useRef(-1);
  const rafRef = useRef<number | null>(null);

  const [eagerLoaded, setEagerLoaded] = useState(0);
  const [ready, setReady] = useState(false);

  const loadFrame = useCallback((index: number, onDone?: () => void) => {
    const slot = slotsRef.current[index];
    if (!slot || slot.done || slot.img) {
      onDone?.();
      return;
    }
    const img = new Image();
    slot.img = img; // mark as in-flight
    img.decoding = "async";
    (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority =
      index < EAGER_COUNT ? "high" : "low";
    img.onload = () => {
      slot.done = true;
      onDone?.();
    };
    img.onerror = () => {
      // Silently continue — drawFrame falls back to the nearest loaded frame.
      slot.img = null;
      slot.done = true;
      onDone?.();
    };
    img.src = framePath(index);
  }, []);

  /* Eager preload first frames, then stream the rest in the background. */
  useEffect(() => {
    let cancelled = false;
    let eagerDone = 0;

    const startBackground = () => {
      if (cancelled) return;
      let cursor = EAGER_COUNT;
      // Aggressive pump: kick off ALL remaining frame fetches with small
      // setTimeout-paced batches. requestIdleCallback starves while the rAF
      // scrub loop is running, leaving most frames unloaded and the scrub
      // visually stuck on the last eagerly-loaded frame.
      const BATCH = 12;
      const pump = () => {
        if (cancelled || cursor >= FRAME_COUNT) return;
        const end = Math.min(cursor + BATCH, FRAME_COUNT);
        for (let i = cursor; i < end; i++) loadFrame(i);
        cursor = end;
        setTimeout(pump, 0);
      };
      pump();
    };

    for (let i = 0; i < EAGER_COUNT; i++) {
      loadFrame(i, () => {
        if (cancelled) return;
        eagerDone++;
        setEagerLoaded(eagerDone);
        if (eagerDone === EAGER_COUNT) {
          setReady(true);
          startBackground();
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [loadFrame]);

  /* DPR-aware canvas sizing via ResizeObserver. */
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(wrap.clientWidth * dpr);
      const h = Math.round(wrap.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        drawnRef.current = -1; // force redraw at new size
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Nearest-loaded fallback (search down, then up)
    let img: HTMLImageElement | null = null;
    for (let i = index; i >= 0; i--) {
      const s = slotsRef.current[i];
      if (s.done && s.img) {
        img = s.img;
        break;
      }
    }
    if (!img) {
      for (let i = index + 1; i < FRAME_COUNT; i++) {
        const s = slotsRef.current[i];
        if (s.done && s.img) {
          img = s.img;
          break;
        }
      }
    }
    if (!img) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // object-fit: cover
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }, []);

  /* Continuous rAF scrub loop — full-page mapping, repaint only on change. */
  useEffect(() => {
    if (!ready) return;
    let alive = true;

    const tick = () => {
      if (!alive) return;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const fraction =
        maxScroll > 0
          ? Math.min(1, Math.max(0, window.scrollY / maxScroll))
          : 0;
      const target = Math.min(
        FRAME_COUNT - 1,
        Math.max(0, Math.round(fraction * (FRAME_COUNT - 1))),
      );

      if (drawnRef.current !== target) {
        // Opportunistically pull the next few frames forward
        for (let i = target; i < Math.min(FRAME_COUNT, target + 8); i++) {
          loadFrame(i);
        }
        drawFrame(target);
        drawnRef.current = target;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      alive = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready, drawFrame, loadFrame]);

  /* Subtle mouse parallax — desktop pointers only, respects reduced motion. */
  useEffect(() => {
    if (!ready) return;
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = (e: MouseEvent) => {
      const moveX = (e.clientX / window.innerWidth - 0.5) * 2;
      const moveY = (e.clientY / window.innerHeight - 0.5) * 2;
      gsap.to(canvas, {
        x: moveX * -15,
        y: moveY * -15,
        duration: 1.5,
        ease: "power2.out",
        overwrite: "auto",
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [ready]);

  const percent = Math.round((eagerLoaded / EAGER_COUNT) * 100);

  return (
    <>
      {/* Fixed background — frames only, NO overlays, NO gradients */}
      <div
        ref={wrapRef}
        className="pointer-events-none fixed inset-0 z-0 bg-black"
      >
        <canvas
          ref={canvasRef}
          className="block h-full w-full scale-[1.04]"
          style={{ willChange: "transform" }}
          aria-hidden="true"
        />
      </div>

      {/* Loading screen */}
      {!ready && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
          role="status"
          aria-live="polite"
        >
          <div className="mb-4 font-mono text-[10px] tracking-widest text-white/50">
            LOADING
          </div>
          <div className="mt-8 h-[1px] w-64 overflow-hidden bg-white/10">
            <div
              className="h-full bg-white transition-[width] duration-200"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}
    </>
  );
}
