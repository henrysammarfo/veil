import { useState, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";

/* ---------- Reveal (motion, viewport-triggered) ---------- */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- NavItem (vertical text fly hover) ---------- */
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

/* ---------- Segmented CTA (text block + arrow block) ---------- */
export function SegmentedCTA({
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
      className="group inline-flex cursor-pointer items-stretch gap-1"
    >
      <span
        className={`px-6 py-4 font-mono text-[12px] tracking-[-0.01em] backdrop-blur-[80px] transition-colors sm:px-8 sm:py-5 ${
          solid
            ? "bg-white font-bold text-black group-hover:bg-gray-200"
            : "bg-white/8 text-white/90 group-hover:bg-white group-hover:text-black"
        }`}
      >
        {label}
      </span>
      <span
        className={`relative flex items-center overflow-hidden px-5 backdrop-blur-[80px] transition-colors sm:px-6 ${
          solid
            ? "bg-white text-black group-hover:bg-gray-200"
            : "bg-white/8 text-white group-hover:bg-white group-hover:text-black"
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

/* ---------- Fixed header (parallaxes out after 500px scroll) ---------- */
function Header() {
  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 500, 800], [0, 0, -150]);

  return (
    <motion.header
      style={{ y: headerY }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-1/2 top-0 z-20 flex w-[90%] -translate-x-1/2 items-center justify-between py-4 md:py-6 lg:py-8"
    >
      <a href="#" className="font-display text-2xl tracking-tight text-white">
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

      {/* Compact CTA on mobile/tablet */}
      <button
        type="button"
        className="bg-white px-4 py-3 font-mono text-[11px] font-bold tracking-[-0.01em] text-black transition-colors hover:bg-gray-200 lg:hidden"
      >
        BEGIN JOURNEY
      </button>
    </motion.header>
  );
}

/* ---------- Hero (Screen 1) ---------- */
export function Hero() {
  return (
    <>
      <Header />

      <section className="mx-auto flex h-screen w-[90%] flex-col py-8 pb-12 md:py-12 lg:py-16">
        <main className="flex w-full flex-1 flex-col justify-end gap-y-8 pt-24 md:grid md:grid-cols-12 md:grid-rows-[1fr_auto] md:gap-x-8 md:gap-y-0 md:pt-0">
          {/* Description — center right */}
          <div className="flex flex-col items-start justify-center text-left md:col-span-5 md:col-start-8 md:row-start-1 md:items-end md:text-right">
            <Reveal delay={0.1}>
              <p className="max-w-[460px] text-[clamp(1rem,1.6vw,1.375rem)] font-normal leading-[1.3] text-white/64">
                The intelligent stealth execution layer for DeepBook on Sui.
                Your order stays private inside a Nautilus TEE until it&rsquo;s
                done —{" "}
                <span className="font-semibold text-white">
                  cryptographically proven, permanently archived.
                </span>
              </p>
            </Reveal>
          </div>

          {/* Heading — bottom left */}
          <div className="flex items-end md:col-span-8 md:col-start-1 md:row-start-2">
            <Reveal delay={0.2}>
              <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-medium leading-[1.05] tracking-tight text-white">
                Trade Smarter.
                <br />
                <em className="italic text-white/64">Stay Invisible.</em>
              </h1>
            </Reveal>
          </div>

          {/* CTA — bottom right */}
          <div className="flex items-end justify-start md:col-span-5 md:col-start-8 md:row-start-2 md:justify-end">
            <Reveal delay={0.3}>
              <SegmentedCTA label="EXPLORE THE ENGINE" />
            </Reveal>
          </div>
        </main>
      </section>
    </>
  );
}
