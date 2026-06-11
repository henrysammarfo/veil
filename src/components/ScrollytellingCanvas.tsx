import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useScrollyConfig } from "@/lib/scrolly-config";
import { useReducedMotion } from "@/lib/use-reduced-motion";

gsap.registerPlugin(ScrollToPlugin);

const framePath = (i: number, pad: number) =>
  `/frames/ezgif-frame-${String(i).padStart(pad, "0")}.jpg`;

type FrameSlot = {
  img: HTMLImageElement | null;
  status: "idle" | "loading" | "loaded" | "error";
};

export function ScrollytellingCanvas() {
  const { config } = useScrollyConfig();
  const reducedMotion = useReducedMotion();
  const { frameCount, zoomFactor, scrollMultiplier, eagerCount } = config;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const framesRef = useRef<FrameSlot[]>([]);
  const currentFrameRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const loaderFocusRef = useRef<HTMLDivElement | null>(null);

  const [loadedEager, setLoadedEager] = useState(0);
  const [ready, setReady] = useState(false);
  const [errorFrame, setErrorFrame] = useState<number | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // (Re)initialize frame slots whenever frameCount changes
  useEffect(() => {
    framesRef.current = Array.from({ length: frameCount }, () => ({
      img: null,
      status: "idle" as const,
    }));
    currentFrameRef.current = 0;
    setLoadedEager(0);
    setReady(false);
    setErrorFrame(null);
  }, [frameCount]);

  const loadFrame = useCallback(
    (index: number, onDone?: () => void) => {
      const slot = framesRef.current[index];
      if (!slot || slot.status === "loaded" || slot.status === "loading") {
        onDone?.();
        return;
      }
      slot.status = "loading";
      const img = new Image();
      img.decoding = "async";
      (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority =
        index < eagerCount ? "high" : "low";
      img.src = framePath(index + 1, 3);
      img.onload = () => {
        slot.img = img;
        slot.status = "loaded";
        onDone?.();
      };
      img.onerror = () => {
        slot.status = "error";
        setErrorFrame(index + 1);
        onDone?.();
      };
    },
    [eagerCount],
  );

  // Eager preload of the first `eagerCount` frames, then background load the rest
  useEffect(() => {
    if (framesRef.current.length === 0) return;
    let cancelled = false;
    const eagerTotal = Math.min(eagerCount, frameCount);
    let eagerDone = 0;

    const startBackground = () => {
      if (cancelled) return;
      let cursor = eagerTotal;
      const idle =
        (window as unknown as { requestIdleCallback?: typeof requestIdleCallback })
          .requestIdleCallback ??
        ((cb: IdleRequestCallback) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 16 } as IdleDeadline), 0));
      const pump = () => {
        if (cancelled || cursor >= frameCount) return;
        const batch = Math.min(8, frameCount - cursor);
        for (let i = 0; i < batch; i++) loadFrame(cursor + i);
        cursor += batch;
        idle(pump);
      };
      pump();
    };

    for (let i = 0; i < eagerTotal; i++) {
      loadFrame(i, () => {
        if (cancelled) return;
        eagerDone++;
        setLoadedEager(eagerDone);
        if (eagerDone === eagerTotal) {
          setReady(true);
          requestAnimationFrame(() => drawFrame(0));
          startBackground();
        }
      });
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameCount, eagerCount, loadFrame]);

  // Focus loader for screen readers when it appears
  useEffect(() => {
    if (!ready && loaderFocusRef.current) {
      loaderFocusRef.current.focus();
    }
  }, [ready]);

  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let slot = framesRef.current[index];
    // Fallback: walk backward to find any already-loaded frame
    if (!slot || slot.status !== "loaded" || !slot.img) {
      for (let i = index; i >= 0; i--) {
        const s = framesRef.current[i];
        if (s?.status === "loaded" && s.img) {
          slot = s;
          break;
        }
      }
    }
    if (!slot || !slot.img) return;
    const img = slot.img;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih) * zoomFactor;
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  };

  // Scroll → frame mapping
  useEffect(() => {
    if (!ready) return;
    const onScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const raw = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      const fraction = Math.min(1, Math.max(0, raw * scrollMultiplier));
      // In reduced-motion, snap to a coarser frame grid (~12 stops total)
      const effectiveCount = reducedMotion
        ? Math.max(2, Math.min(frameCount, 12))
        : frameCount;
      const frameIndex = Math.min(
        frameCount - 1,
        Math.max(
          0,
          Math.floor(fraction * (effectiveCount - 1)) *
            Math.floor((frameCount - 1) / Math.max(1, effectiveCount - 1)),
        ),
      );
      setShowScrollTop(window.scrollY > window.innerHeight * 0.6);
      if (frameIndex === currentFrameRef.current) return;
      currentFrameRef.current = frameIndex;
      // Opportunistically load near-window frames if still pending
      for (let i = frameIndex; i < Math.min(frameCount, frameIndex + 6); i++) {
        loadFrame(i);
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => drawFrame(frameIndex));
    };
    const onResize = () => drawFrame(currentFrameRef.current);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    onScroll();
    onResize();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, frameCount, scrollMultiplier, zoomFactor, reducedMotion]);

  // Mouse parallax — disabled under reduced motion
  useEffect(() => {
    if (!ready || reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * -20;
      const y = (e.clientY / window.innerHeight - 0.5) * -20;
      gsap.to(canvas, { x, y, duration: 0.8, ease: "power2.out", overwrite: "auto" });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [ready, reducedMotion]);

  const scrollToTop = () => {
    if (reducedMotion) {
      window.scrollTo({ top: 0, behavior: "auto" });
    } else {
      gsap.to(window, { duration: 1.2, scrollTo: 0, ease: "power3.inOut" });
    }
  };

  const percent = Math.round(
    (loadedEager / Math.max(1, Math.min(eagerCount, frameCount))) * 100,
  );

  return (
    <>
      {/* Fixed canvas layer */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-black">
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          style={{ transform: "scale(1.05)", willChange: "transform" }}
          aria-hidden="true"
        />
      </div>

      {/* Loading overlay — accessible */}
      {!ready && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label={`Loading scene, ${percent} percent complete`}
        >
          <div
            ref={loaderFocusRef}
            tabIndex={-1}
            className="flex flex-col items-center gap-6 rounded-3xl border border-white/15 px-12 py-10 backdrop-blur-2xl outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.2), 0 30px 80px rgba(0,0,0,0.6)",
            }}
          >
            <div className="text-6xl text-white" style={{ fontFamily: '"Instrument Serif", serif' }}>
              {percent}
              <span className="text-2xl text-white/50">%</span>
            </div>
            <div
              className="h-px w-48 overflow-hidden bg-white/10"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full bg-white transition-[width] duration-200" style={{ width: `${percent}%` }} />
            </div>
            <div className="text-xs uppercase tracking-[0.3em] text-white/40">Loading Frames</div>
            {errorFrame !== null && (
              <div className="text-xs text-amber-300/80" role="alert">
                Frame {errorFrame} failed to load — continuing with available frames.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Non-blocking error toast once ready */}
      {ready && errorFrame !== null && (
        <div
          role="alert"
          className="fixed bottom-24 right-8 z-50 max-w-xs rounded-2xl border border-amber-300/30 bg-black/60 px-4 py-3 text-xs text-amber-200 backdrop-blur-xl"
        >
          Some frames failed to load. Animation continues with available frames.
        </div>
      )}

      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white backdrop-blur-xl transition-all duration-300 hover:scale-110 ${
          showScrollTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.04))",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 10px 30px rgba(0,0,0,0.4)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </>
  );
}
