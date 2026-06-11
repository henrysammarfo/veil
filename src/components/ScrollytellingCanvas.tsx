import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

const FRAME_COUNT = 181;
const ZOOM_FACTOR = 1.35;

const framePath = (i: number) =>
  `/frames/ezgif-frame-${String(i).padStart(3, "0")}.jpg`;

export function ScrollytellingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Preload frames
  useEffect(() => {
    let cancelled = false;
    let count = 0;
    const imgs: HTMLImageElement[] = [];
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = framePath(i);
      img.onload = img.onerror = () => {
        if (cancelled) return;
        count++;
        setLoaded(count);
        if (count === FRAME_COUNT) {
          setReady(true);
          requestAnimationFrame(() => drawFrame(0));
        }
      };
      imgs[i - 1] = img;
    }
    framesRef.current = imgs;
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    const img = framesRef.current[index];
    if (!canvas || !img || !img.complete || !img.naturalWidth) return;
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

    // object-fit: cover with zoom factor
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih) * ZOOM_FACTOR;
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  };

  // Scroll-to-frame mapping
  useEffect(() => {
    if (!ready) return;

    const onScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const fraction = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      const frameIndex = Math.min(
        FRAME_COUNT - 1,
        Math.max(0, Math.floor(fraction * (FRAME_COUNT - 1))),
      );
      setShowScrollTop(window.scrollY > window.innerHeight * 0.6);
      if (frameIndex === currentFrameRef.current) return;
      currentFrameRef.current = frameIndex;
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
  }, [ready]);

  // Mouse parallax
  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * -20;
      const y = (e.clientY / window.innerHeight - 0.5) * -20;
      gsap.to(canvas, {
        x,
        y,
        duration: 0.8,
        ease: "power2.out",
        overwrite: "auto",
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [ready]);

  const scrollToTop = () => {
    gsap.to(window, { duration: 1.2, scrollTo: 0, ease: "power3.inOut" });
  };

  const percent = Math.round((loaded / FRAME_COUNT) * 100);

  return (
    <>
      {/* Fixed canvas layer */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-black">
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          style={{ transform: "scale(1.05)", willChange: "transform" }}
        />
      </div>

      {/* Loading overlay — liquid glass */}
      {!ready && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
          <div
            className="flex flex-col items-center gap-6 rounded-3xl border border-white/15 px-12 py-10 backdrop-blur-2xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.2), 0 30px 80px rgba(0,0,0,0.6)",
            }}
          >
            <div
              className="text-6xl text-white"
              style={{ fontFamily: '"Instrument Serif", serif' }}
            >
              {percent}
              <span className="text-2xl text-white/50">%</span>
            </div>
            <div className="h-px w-48 overflow-hidden bg-white/10">
              <div
                className="h-full bg-white transition-[width] duration-200"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="text-xs uppercase tracking-[0.3em] text-white/40">
              Loading Frames
            </div>
          </div>
        </div>
      )}

      {/* Scroll-to-top — liquid glass */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white backdrop-blur-xl transition-all duration-300 hover:scale-110 ${
          showScrollTop
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.04))",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.25), 0 10px 30px rgba(0,0,0,0.4)",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </>
  );
}
