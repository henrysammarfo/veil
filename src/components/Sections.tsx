import { Reveal, SegmentedCTA } from "@/components/Hero";
import { ScrollReveal } from "@/components/ScrollReveal";

/* 200px vertical gap between every section, per template */
function Spacer() {
  return <div aria-hidden className="h-[200px] w-full" />;
}

export function Sections() {
  return (
    <div className="relative">
      <Spacer />

      {/* ---------- SECTION 2: Scroll-reveal text + 3-column grid ---------- */}
      <section className="mx-auto flex min-h-screen w-[90%] flex-col justify-center py-8 md:py-12 lg:py-16">
        <div className="w-full max-w-[1200px]">
          <ScrollReveal
            containerClassName="text-white"
            textClassName="font-display text-[clamp(2rem,4.5vw,4rem)] font-medium leading-[1.1] tracking-tight"
          >
            Complete Stealth Execution For Professional On-Chain Traders. We
            Build The Foundations For Private, Provable, Permanent Markets On
            Sui.
          </ScrollReveal>

          <div className="mt-24 grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-4">
              <Reveal>
                <div className="flex items-center gap-4">
                  <span className="font-display text-3xl text-white">
                    Veil<sup className="align-super text-[10px]">®</sup>
                  </span>
                </div>
                <p className="mt-6 font-mono text-[11px] uppercase leading-relaxed tracking-widest text-white/60">
                  Winning the future in silence
                </p>
              </Reveal>
            </div>

            <div className="md:col-span-4">
              <Reveal delay={0.1}>
                <h3 className="text-xl font-medium text-white">
                  Nautilus TEE Execution
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-white/80">
                  Your size and direction never touch a public mempool. Orders
                  execute inside hardware-attested enclaves, invisible to
                  front-runners until the fill is complete.
                </p>
              </Reveal>
            </div>

            <div className="md:col-span-4">
              <Reveal delay={0.2}>
                <h3 className="text-xl font-medium text-white">
                  Verified &amp; Archived Forever
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-white/80">
                  Every decision the engine makes is cryptographically signed,
                  verified on-chain, and permanently archived on Walrus —
                  auditable by anyone, forever.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <Spacer />

      {/* ---------- SECTION 3: Precision engineering + feature boxes ---------- */}
      <section className="mx-auto w-[90%] border-t border-white/10 pt-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-7">
            <ScrollReveal
              containerClassName="text-white"
              textClassName="font-display text-[clamp(2rem,4.5vw,4rem)] font-medium leading-[1.1] tracking-tight"
            >
              Precision engineering for the harshest markets.
            </ScrollReveal>
          </div>
          <div className="flex flex-col items-start justify-center gap-8 md:col-span-5">
            <Reveal>
              <p className="max-w-[460px] text-[15px] leading-relaxed text-white/80">
                We prioritize privacy, verifiability, and permanence. Express
                any market view in plain English — Veil converts intent into an
                optimally-timed position, slices it across volatility, and
                settles it privately on DeepBook Predict.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <SegmentedCTA label="SEE SPECIFICATIONS" />
            </Reveal>
          </div>
        </div>

        <div className="mt-32 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          {[
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
          ].map((f, i) => (
            <Reveal key={f.n} delay={0.1 + i * 0.1}>
              <div className="border-t border-white/20 pt-8">
                <div className="mb-2 text-3xl font-light text-white">{f.n}</div>
                <h3 className="mb-3 text-xl font-medium text-white">
                  {f.title}
                </h3>
                <p className="text-[14px] leading-relaxed text-white/72">
                  {f.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Spacer />

      {/* ---------- SECTION 4: CTA ---------- */}
      <section className="mx-auto flex w-[90%] flex-col items-center border-t border-white/10 pt-24 text-center">
        <Reveal>
          <h2 className="max-w-[800px] font-display text-[clamp(2.5rem,6vw,5rem)] font-medium leading-[1.05] tracking-tight text-white">
            Ready to trade in{" "}
            <em className="italic text-white/64">silence?</em>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-20 flex flex-wrap items-center justify-center gap-6">
            <SegmentedCTA label="BEGIN JOURNEY" variant="solid" />
            <button
              type="button"
              className="bg-white/8 px-8 py-5 font-mono text-[12px] tracking-[-0.01em] text-white/90 backdrop-blur-[80px] transition-colors hover:bg-white hover:text-black"
            >
              READ THE BIBLE
            </button>
          </div>
        </Reveal>
      </section>

      <Spacer />

      {/* ---------- FOOTER: glassmorphism card (scroll endpoint) ---------- */}
      <footer className="mx-auto w-[90%] max-w-7xl pb-16">
        <div
          style={{
            backgroundColor: "rgba(26, 26, 26, 0.6)",
            backdropFilter: "blur(80px)",
            WebkitBackdropFilter: "blur(80px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            padding: "clamp(32px, 4vw, 64px)",
          }}
        >
          <div
            className="flex flex-wrap items-end justify-between gap-10"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              paddingBottom: "clamp(48px, 4vw, 80px)",
            }}
          >
            <Reveal>
              <h2
                className="font-display text-white"
                style={{
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

          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "clamp(32px, 3vw, 48px)",
              paddingTop: "clamp(48px, 4vw, 64px)",
            }}
          >
            <div>
              <div className="font-display text-white" style={{ fontSize: 24 }}>
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
                {
                  h: "CONNECT",
                  items: ["X / Twitter", "Discord", "GitHub", "Newsletter"],
                },
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
