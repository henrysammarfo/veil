import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useReducedMotion } from "@/lib/use-reduced-motion";

gsap.registerPlugin(ScrollToPlugin);

export type Chapter = { id: string; label: string };

export const CHAPTERS: Chapter[] = [
  { id: "chapter-hero", label: "Overture" },
  { id: "chapter-0", label: "The Problem" },
  { id: "chapter-1", label: "The Solution" },
  { id: "chapter-2", label: "How It Works" },
  { id: "chapter-cta", label: "Begin" },
  { id: "chapter-footer", label: "Footer" },
];

export function ChapterNav() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let offsets: { top: number; height: number }[] = [];
    const measure = () => {
      offsets = CHAPTERS.map((c) => {
        const el = document.getElementById(c.id);
        if (!el) return { top: 0, height: 0 };
        const top = el.getBoundingClientRect().top + window.scrollY;
        return { top, height: el.offsetHeight };
      });
    };

    let ticking = false;
    const compute = () => {
      ticking = false;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const p = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      setProgress(Math.min(1, Math.max(0, p)));

      const mid = window.scrollY + window.innerHeight / 2;
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < offsets.length; i++) {
        const o = offsets[i];
        if (!o.height) continue;
        const d = Math.abs(o.top + o.height / 2 - mid);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      setActive(best);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(compute);
    };
    const onResize = () => {
      measure();
      compute();
    };

    requestAnimationFrame(() => {
      measure();
      compute();
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onResize);
    // Recompute offsets occasionally in case images/sections grow after mount
    const recheck = window.setInterval(measure, 1500);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onResize);
      window.clearInterval(recheck);
    };
  }, []);

  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const jumpTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY;
    if (reduced) {
      window.scrollTo({ top: y, behavior: "auto" });
    } else {
      gsap.to(window, { duration: 1, scrollTo: y, ease: "power3.inOut" });
    }
  };

  const focusAndJump = (i: number) => {
    const clamped = Math.max(0, Math.min(CHAPTERS.length - 1, i));
    btnRefs.current[clamped]?.focus();
    jumpTo(CHAPTERS[clamped].id);
  };

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        focusAndJump(i + 1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        e.preventDefault();
        focusAndJump(i - 1);
        break;
      case "Home":
        e.preventDefault();
        focusAndJump(0);
        break;
      case "End":
        e.preventDefault();
        focusAndJump(CHAPTERS.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        jumpTo(CHAPTERS[i].id);
        break;
    }
  };

  return (
    <nav
      aria-label="Chapters"
      className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 md:block"
    >
      <div
        role="tablist"
        aria-orientation="vertical"
        className="flex flex-col gap-3 rounded-full border border-white/15 px-3 py-4 backdrop-blur-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.2), 0 20px 50px rgba(0,0,0,0.5)",
        }}
      >
        {CHAPTERS.map((c, i) => {
          const isActive = active === i;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              onClick={() => jumpTo(c.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              aria-label={`Jump to ${c.label}`}
              aria-selected={isActive}
              aria-current={isActive ? "true" : undefined}
              tabIndex={isActive ? 0 : -1}
              className="group relative flex items-center justify-end gap-3 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <span
                className={`pointer-events-none whitespace-nowrap text-[10px] uppercase tracking-[0.3em] transition-opacity ${
                  isActive ? "opacity-100 text-white" : "opacity-0 text-white/60 group-hover:opacity-100 group-focus-visible:opacity-100"
                }`}
              >
                {c.label}
              </span>
              <span
                className={`block h-2 w-2 rounded-full transition-all duration-300 ${
                  isActive ? "scale-150 bg-white" : "bg-white/30 group-hover:bg-white/60"
                }`}
              />
            </button>
          );
        })}
        <div
          className="mx-auto mt-1 h-12 w-px overflow-hidden bg-white/10"
          aria-hidden="true"
        >
          <div
            className="w-full bg-white transition-[height] duration-150"
            style={{ height: `${progress * 100}%` }}
          />
        </div>
      </div>
    </nav>
  );
}
