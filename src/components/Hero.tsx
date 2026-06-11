import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";

/* ---------- Reveal ---------- */
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
      ([e]) => e.isIntersecting && (setShown(true), io.disconnect()),
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

/* ---------- NavItem (hover fly-up) ---------- */
function NavItem({ label }: { label: string }) {
  const [cycle, setCycle] = useState(0);
  return (
    <a
      href="#"
      onMouseEnter={() => setCycle((c) => c + 1)}
      onMouseLeave={() => setCycle((c) => c + 1)}
      className="group relative flex items-center justify-center overflow-hidden py-1"
    >
      {cycle === 0 ? (
        <span className="text-white/64 transition-colors duration-300 group-hover:text-white">
          {label}
        </span>
      ) : (
        <>
          <span key={`out-${cycle}`} className="animate-fly-out-up text-white">
            {label}
          </span>
          <span
            key={`in-${cycle}`}
            className="animate-fly-in-up absolute inset-0 flex items-center justify-center text-white"
          >
            {label}
          </span>
        </>
      )}
    </a>
  );
}

/* ---------- Segmented CTA ---------- */
function SegmentedCTA({
  label,
  variant = "glass",
}: {
  label: string;
  variant?: "glass" | "solid";
}) {
  const [cycle, setCycle] = useState(0);
  const solid = variant === "solid";
  return (
    <button
      type="button"
      onMouseEnter={() => setCycle((c) => c + 1)}
      onMouseLeave={() => setCycle((c) => c + 1)}
      className="group inline-flex cursor-pointer items-stretch gap-px"
    >
      <span
        className={`px-8 py-5 font-mono text-[12px] font-medium tracking-[-0.01em] backdrop-blur-[80px] transition-colors ${
          solid
            ? "bg-white text-black group-hover:bg-white/90"
            : "bg-white/[0.08] text-white/90 group-hover:bg-white group-hover:text-black"
        }`}
      >
        {label}
      </span>
      <span
        className={`relative flex items-center overflow-hidden px-6 backdrop-blur-[80px] transition-colors ${
          solid
            ? "bg-white text-black group-hover:bg-white/90"
            : "bg-white/[0.08] text-white group-hover:bg-white group-hover:text-black"
        }`}
      >
        {cycle === 0 ? (
          <ArrowRight className="h-5 w-5" />
        ) : (
          <>
            <ArrowRight key={`o-${cycle}`} className="animate-fly-out h-5 w-5" />
            <ArrowRight
              key={`i-${cycle}`}
              className="animate-fly-in absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2"
            />
          </>
        )}
      </span>
    </button>
  );
}

/* ---------- Fixed header ---------- */
function Header() {
  return (
    <header className="fixed left-1/2 top-0 z-30 flex w-[90%] -translate-x-1/2 items-center justify-between py-4 md:py-6 lg:py-8">
      <a
        href="#"
        className="font-display text-2xl tracking-tight text-white"
      >
        Veil<sup className="align-super text-[10px]">®</sup>
      </a>

      <div className="hidden items-stretch lg:flex">
        <nav className="flex w-[480px] items-center justify-between bg-[#1A1A1A]/40 px-6 font-mono text-xs tracking-[-0.01em] backdrop-blur-[80px]">
          {["ENGINE", "PREDICT", "BIBLE", "JOURNAL", "REACH"].map((l) => (
            <NavItem key={l} label={l} />
          ))}
        </nav>
        <button
          type="button"
          className="w-[148px] bg-white px-6 py-5 font-mono text-xs font-bold leading-4 tracking-[-0.01em] text-black transition-colors hover:bg-gray-200"
        >
          BEGIN JOURNEY
        </button>
      </div>
    </header>
  );
}

/* ---------- Hero ---------- */
export function Hero() {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-black/20 to-black/85" />

      <Header />

      <main className="relative z-10 mx-auto flex h-full w-[90%] flex-col py-8 pb-12 md:py-12 lg:py-16">
        <div className="flex flex-1 flex-col gap-y-10 md:grid md:grid-cols-12 md:grid-rows-[1fr_auto] md:gap-x-8 md:gap-y-0">
          {/* Description — top-right */}
          <div className="flex flex-col items-start justify-start text-left md:col-span-5 md:col-start-8 md:row-start-1 md:items-end md:justify-center md:text-right">
            <Reveal delay={0.1}>
              <p className="max-w-[460px] text-[clamp(1rem,1.4vw,1.25rem)] font-normal leading-[1.35] text-white/72">
                The intelligent stealth execution layer for DeepBook on Sui.
                Your order stays private inside a Nautilus TEE until it&rsquo;s
                done —{" "}
                <span className="font-semibold text-white">
                  cryptographically proven, permanently archived.
                </span>
              </p>
            </Reveal>
          </div>

          {/* Heading — bottom-left */}
          <div className="flex items-end md:col-span-8 md:col-start-1 md:row-start-2">
            <Reveal delay={0.2}>
              <h1
                className="font-display text-white"
                style={{
                  fontSize: "clamp(3rem, 8vw, 6.5rem)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.025em",
                  fontWeight: 400,
                }}
              >
                Trade smarter. <br />
                <em className="italic text-white/55">Stay invisible.</em>
              </h1>
            </Reveal>
          </div>

          {/* CTA — bottom-right */}
          <div className="flex items-end justify-start md:col-span-5 md:col-start-8 md:row-start-2 md:justify-end">
            <Reveal delay={0.3}>
              <SegmentedCTA label="EXPLORE THE ENGINE" />
            </Reveal>
          </div>
        </div>
      </main>
    </div>
  );
}
