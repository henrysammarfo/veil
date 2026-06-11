import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";

/* ---------- Reveal: fade + rise when entering viewport ---------- */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "-50px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(30px)",
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ---------- Scroll-reveal blurred-words headline ---------- */
function ScrollReveal({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // 0 when bottom of element enters viewport, 1 when top reaches 30% from top
        const p =
          (vh - rect.top) / (vh + rect.height * 0.4);
        setProgress(Math.max(0, Math.min(1, p)));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const words = text.split(" ");
  return (
    <p ref={ref} className={`m-0 flex flex-wrap ${className}`}>
      {words.map((w, i) => {
        const step = i / Math.max(1, words.length - 1);
        const local = Math.max(0, Math.min(1, (progress - step * 0.6) / 0.4));
        return (
          <span
            key={`${w}-${i}`}
            className="inline-block whitespace-pre"
            style={{
              opacity: 0.1 + local * 0.9,
              filter: `blur(${(1 - local) * 4}px)`,
              transition: "opacity 0.1s linear, filter 0.1s linear",
            }}
          >
            {w + " "}
          </span>
        );
      })}
    </p>
  );
}

/* ---------- Segmented CTA: text block + arrow block ---------- */
function SegmentedCTA({
  label,
  variant = "glass",
}: {
  label: string;
  variant?: "glass" | "solid";
}) {
  const solid = variant === "solid";
  return (
    <button
      type="button"
      className="group inline-flex cursor-pointer items-stretch gap-px"
    >
      <span
        className={`px-8 py-5 font-mono text-[12px] tracking-[-0.01em] backdrop-blur-[80px] transition-colors ${
          solid
            ? "bg-white text-black group-hover:bg-white/90"
            : "bg-white/[0.08] text-white/90 group-hover:bg-white group-hover:text-black"
        }`}
      >
        {label}
      </span>
      <span
        className={`flex items-center px-6 backdrop-blur-[80px] transition-colors ${
          solid
            ? "bg-white text-black group-hover:bg-white/90"
            : "bg-white/[0.08] text-white group-hover:bg-white group-hover:text-black"
        }`}
      >
        <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </button>
  );
}

/* ---------- Story sections ---------- */
type Section = { eyebrow: string; title: ReactNode; body: string };
const sections: Section[] = [
  {
    eyebrow: "The Problem",
    title: (
      <>
        Every order on a public ledger is{" "}
        <em className="italic text-[#6F6F6F]">visible</em> before it executes.
      </>
    ),
    body: "Front-running costs DeFi traders billions each year. On DeepBook without Veil, a $50,000 prediction order is broadcast to every market participant before it fills.",
  },
  {
    eyebrow: "The Solution",
    title: (
      <>
        Stealth execution,{" "}
        <em className="italic text-[#6F6F6F]">cryptographically</em> proven.
      </>
    ),
    body: "Veil runs your order inside a Nautilus TEE — your size and direction stay hidden until execution completes. Every decision is verified on-chain and archived on Walrus.",
  },
  {
    eyebrow: "How It Works",
    title: (
      <>
        Speak the trade. We{" "}
        <em className="italic text-[#6F6F6F]">execute the silence.</em>
      </>
    ),
    body: "Express any market view in plain English. Veil converts intent into an optimally-timed prediction position, slices it across volatility, and settles it privately on DeepBook Predict.",
  },
];

const features = [
  {
    n: "01",
    title: "Nautilus TEE",
    body: "Hardware-attested execution enclaves. Your order never touches a public mempool.",
  },
  {
    n: "02",
    title: "Verified On-Chain",
    body: "Every decision the engine makes is cryptographically signed and replayable.",
  },
  {
    n: "03",
    title: "Walrus Archive",
    body: "Permanent, decentralized records of every fill, slice, and proof. Forever auditable.",
  },
];

export function Sections() {
  return (
    <div className="relative z-10">
      {/* spacer between hero and story */}
      <div className="h-[200px] w-full" />

      {sections.map((s, i) => (
        <section
          key={s.eyebrow}
          id={`chapter-${i}`}
          aria-labelledby={`section-${i}`}
          className="relative mx-auto flex min-h-screen w-[90%] max-w-6xl flex-col justify-center px-2 py-32"
        >
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 70%)",
            }}
          />
          <Reveal>
            <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.4em] text-white/40">
              {s.eyebrow}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2
              id={`section-${i}`}
              className="max-w-4xl text-white"
              style={{
                fontFamily: '"Instrument Serif", serif',
                fontSize: "clamp(2.25rem, 5.5vw, 4.5rem)",
                lineHeight: 1.02,
                letterSpacing: "-1.5px",
              }}
            >
              {s.title}
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-white/64 sm:text-base">
              {s.body}
            </p>
          </Reveal>

          <div className="h-[200px] w-full" aria-hidden="true" />
        </section>
      ))}

      {/* Precision / feature grid */}
      <section
        id="chapter-features"
        aria-label="Engine"
        className="relative mx-auto w-[90%] max-w-6xl border-t border-white/10 px-2 py-32"
      >
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.9) 75%)",
          }}
        />
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <ScrollReveal
              text="Precision engineering for the harshest markets."
              className="text-white"
            />
          </div>
          <div className="flex flex-col items-start gap-8 md:col-span-5">
            <Reveal delay={0.1}>
              <p className="max-w-md text-[15px] leading-relaxed text-white/64">
                We prioritize privacy, verifiability, and execution quality.
                Built for traders who refuse to leak alpha to the mempool.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <SegmentedCTA label="SEE SPECIFICATIONS" />
            </Reveal>
          </div>
        </div>

        <div className="mt-32 grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.n} delay={0.1 + i * 0.1}>
              <div className="border-t border-white/20 pt-8">
                <div className="mb-2 font-light text-3xl text-white">{f.n}</div>
                <h3 className="mb-3 text-xl font-medium text-white">{f.title}</h3>
                <p className="text-[14px] leading-relaxed text-white/64">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="h-[200px] w-full" aria-hidden="true" />
      </section>

      {/* CTA */}
      <section
        id="chapter-cta"
        aria-label="Begin"
        className="relative mx-auto flex w-[90%] max-w-4xl flex-col items-center border-t border-white/10 px-2 py-32 text-center"
      >
        <Reveal>
          <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.4em] text-white/40">
            Begin
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2
            className="max-w-3xl text-white"
            style={{
              fontFamily: '"Instrument Serif", serif',
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              lineHeight: 1.02,
              letterSpacing: "-2px",
            }}
          >
            Ready to trade in <em className="italic text-[#6F6F6F]">silence?</em>
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <SegmentedCTA label="BEGIN JOURNEY" variant="solid" />
            <button
              type="button"
              className="bg-white/[0.08] px-8 py-5 font-mono text-[12px] tracking-[-0.01em] text-white/90 backdrop-blur-[80px] transition-colors hover:bg-white/[0.14]"
            >
              READ THE BIBLE
            </button>
          </div>
        </Reveal>

        <div className="h-[200px] w-full" aria-hidden="true" />
      </section>

      {/* Glass footer */}
      <footer
        id="chapter-footer"
        className="relative mx-auto w-[90%] max-w-7xl pb-16"
      >
        <div
          style={{
            backgroundColor: "rgba(26, 26, 26, 0.6)",
            backdropFilter: "blur(80px)",
            WebkitBackdropFilter: "blur(80px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            padding: "clamp(32px, 4vw, 64px)",
          }}
        >
          {/* CTA strip */}
          <div
            className="flex flex-wrap items-end justify-between gap-10"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              paddingBottom: "clamp(48px, 4vw, 80px)",
            }}
          >
            <Reveal>
              <h2
                className="text-white"
                style={{
                  fontFamily: '"Instrument Serif", serif',
                  fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.05,
                }}
              >
                Step into the veil. <br />
                Your edge stays yours.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <SegmentedCTA label="LAUNCH VEIL" variant="solid" />
            </Reveal>
          </div>

          {/* Link grid */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "clamp(32px, 3vw, 48px)",
              paddingTop: "clamp(48px, 4vw, 64px)",
            }}
          >
            <div>
              <div
                className="text-white"
                style={{ fontFamily: '"Instrument Serif", serif', fontSize: 24 }}
              >
                Veil<sup className="align-super text-[10px]">®</sup>
              </div>
              <p
                className="mt-4"
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.4)",
                  maxWidth: 220,
                  lineHeight: 1.5,
                }}
              >
                The stealth execution layer for DeepBook on Sui.
              </p>
            </div>
            {(
              [
                { h: "PRODUCT", items: ["Engine", "Predict", "API", "Pricing"] },
                { h: "COMPANY", items: ["About", "Bible", "Press", "Contact"] },
                { h: "CONNECT", items: ["X / Twitter", "Discord", "GitHub", "Newsletter"] },
              ] as const
            ).map((col) => (
              <div key={col.h}>
                <div
                  className="font-mono uppercase"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  {col.h}
                </div>
                <ul className="mt-4 space-y-3">
                  {col.items.map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}
                        className="transition-colors hover:text-white"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Copyright */}
          <div
            className="flex flex-wrap items-center justify-between gap-4"
            style={{
              marginTop: 56,
              paddingTop: 32,
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <span
              className="font-mono uppercase"
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.25)",
                letterSpacing: "0.1em",
              }}
            >
              © 2026 Veil. All rights reserved.
            </span>
            <div className="flex gap-6">
              {["Privacy", "Terms"].map((l) => (
                <a
                  key={l}
                  href="#"
                  className="font-mono uppercase transition-colors hover:text-white"
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.25)",
                    letterSpacing: "0.1em",
                  }}
                >
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
