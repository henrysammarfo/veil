import { Link } from "@tanstack/react-router";
import { Reveal, SegmentedCTA } from "@/components/Hero";
import {
  isWaitlistOnlyMode,
  marketingActionLabel,
  marketingActionPath,
} from "@/lib/access";
import { ScrollReveal } from "@/components/ScrollReveal";

const FOOTER_LINKS = {
  PRODUCT: [
    { label: "Engine", to: "/studio" },
    { label: "4 Modes", to: "/studio" },
    { label: "Waitlist", to: "/waitlist" },
    { label: "Roadmap", to: "/roadmap" },
  ],
  COMPANY: [
    { label: "About", to: "/about" },
    { label: "Journal", to: "/journal" },
    { label: "DeepSurge", href: "https://www.deepsurge.xyz/projects?hackathon=b587dc0c-4cb8-4e63-ada5-519df38103bf&tracks=Special+-+DeepBook" },
    { label: "Contact", to: "/reach" },
  ],
  CONNECT: [
    { label: "DeepBook", href: "https://x.com/DeepBookonSui" },
    { label: "Telegram", href: "https://t.me/+bZTS2KvwIBQyOGZl" },
    { label: "GitHub", href: "https://github.com/henrysammarfo/veil" },
    { label: "Judge guide", href: "https://github.com/henrysammarfo/veil/blob/main/docs/JUDGES.md" },
  ],
} as const;

function Spacer() {
  return <div aria-hidden className="h-[200px] w-full" />;
}

export function Sections() {
  return (
    <div className="relative">
      <Spacer />

      <section className="mx-auto flex min-h-screen w-[90%] flex-col justify-center py-8 md:py-12 lg:py-16">
        <div className="w-full max-w-[1200px]">
          <ScrollReveal
            containerClassName="text-white"
            textClassName="font-display text-[clamp(2rem,4.5vw,4rem)] font-medium leading-[1.1] tracking-tight"
          >
            Complete Stealth Execution For Professional On-Chain Traders. We Build The Foundations
            For Private, Provable, Permanent Markets On Sui.
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
                  BULL · BEAR · EARN · PARLAY — all stealth, all proven
                </p>
              </Reveal>
            </div>

            <div className="md:col-span-4">
              <Reveal delay={0.1}>
                <h3 className="text-xl font-medium text-white">Nautilus TEE Execution</h3>
                <p className="mt-4 text-[15px] leading-relaxed text-white/80">
                  Your size and direction never touch a public mempool. Orders execute inside
                  hardware-attested enclaves on DeepBook Predict — invisible to front-runners.
                </p>
              </Reveal>
            </div>

            <div className="md:col-span-4">
              <Reveal delay={0.2}>
                <h3 className="text-xl font-medium text-white">Verified &amp; Archived Forever</h3>
                <p className="mt-4 text-[15px] leading-relaxed text-white/80">
                  Every fill is signed by the enclave, verified on Sui, and sealed to Walrus —
                  real profit/loss when positions settle, auditable by anyone.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <Spacer />

      <section className="mx-auto w-[90%] border-t border-white/10 pt-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-7">
            <ScrollReveal
              containerClassName="text-white"
              textClassName="font-display text-[clamp(2rem,4.5vw,4rem)] font-medium leading-[1.1] tracking-tight"
            >
              Four modes. One stealth engine. Built for DeepBook Predict.
            </ScrollReveal>
          </div>
          <div className="flex flex-col items-start justify-center gap-8 md:col-span-5">
            <Reveal>
              <p className="max-w-[460px] text-[15px] leading-relaxed text-white/80">
                From first-time zkLogin users to power traders: express intent in plain English,
                pick BULL/BEAR/EARN/PARLAY, and let Veil slice, attest, and settle on Predict
                testnet with Enoki gasless txs.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <SegmentedCTA label="SEE SPECIFICATIONS" to="/studio" />
            </Reveal>
          </div>
        </div>

        <div className="mt-32 grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-8">
          {[
            { n: "01", title: "BULL", body: "Kelly-sized directional mints on Predict — sliced in the TEE." },
            { n: "02", title: "BEAR", body: "Vault + tail hedge — yield when flat, protected when wrong." },
            { n: "03", title: "EARN", body: "Idle dUSDC → PLP yield. Keeper redeems and compounds." },
            { n: "04", title: "PARLAY", body: "Multi-leg conviction with correlation-aware Kelly sizing." },
          ].map((f, i) => (
            <Reveal key={f.n} delay={0.1 + i * 0.1}>
              <div className="border-t border-white/20 pt-8">
                <div className="mb-2 text-3xl font-light text-white">{f.n}</div>
                <h3 className="mb-3 text-xl font-medium text-white">{f.title}</h3>
                <p className="text-[14px] leading-relaxed text-white/72">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Spacer />

      <section className="mx-auto w-[90%] border-t border-white/10 py-24">
        <Reveal>
          <div className="mx-auto max-w-xl text-center">
            {isWaitlistOnlyMode() ? (
              <>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-violet-300">
                  Waitlist open · Sui Overflow 2026
                </p>
                <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] text-white">
                  Testnet access for the community first.
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-white/70">
                  Join the waitlist now. When we&apos;re shortlisted, early access unlocks — wallet
                  or Google zkLogin.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <SegmentedCTA label="JOIN WAITLIST" to="/waitlist" variant="solid" />
                  <Link
                    to="/auth"
                    className="inline-flex items-center px-6 py-4 font-mono text-[11px] uppercase tracking-wider text-white/80 underline-offset-4 hover:text-white hover:underline"
                  >
                    Already have access → sign in
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-violet-300">
                  Live demo · DeepBook Predict testnet
                </p>
                <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] text-white">
                  Try stealth execution now.
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-white/70">
                  Sign in with Google or Sui Wallet, fund your PredictManager with testnet dUSDC,
                  and place a plain-English intent — no repo clone required.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <SegmentedCTA
                    label={marketingActionLabel()}
                    to={marketingActionPath()}
                    variant="solid"
                  />
                  <Link
                    to="/studio"
                    className="inline-flex items-center px-6 py-4 font-mono text-[11px] uppercase tracking-wider text-white/80 underline-offset-4 hover:text-white hover:underline"
                  >
                    Read the spec →
                  </Link>
                </div>
              </>
            )}
          </div>
        </Reveal>
      </section>

      <Spacer />

      <section className="mx-auto flex w-[90%] flex-col items-center border-t border-white/10 pt-24 text-center">
        <Reveal>
          <h2 className="max-w-[800px] font-display text-[clamp(2.5rem,6vw,5rem)] font-medium leading-[1.05] tracking-tight text-white">
            Ready to trade in <em className="italic text-white/64">silence?</em>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-20 flex flex-wrap items-center justify-center gap-6">
            <SegmentedCTA
              label={marketingActionLabel()}
              variant="solid"
              to={marketingActionPath()}
            />
            <Link
              to="/studio"
              className="bg-white/8 px-8 py-5 font-mono text-[12px] tracking-[-0.01em] text-white/90 backdrop-blur-[80px] transition-colors hover:bg-white hover:text-black"
            >
              READ THE SPEC
            </Link>
          </div>
        </Reveal>
      </section>

      <Spacer />

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
              <SegmentedCTA label={marketingActionLabel()} variant="solid" to={marketingActionPath()} />
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
                Stealth execution layer for DeepBook Predict on Sui testnet.
              </p>
            </div>
            {(Object.entries(FOOTER_LINKS) as [string, readonly { label: string; to?: string; href?: string }[]][]).map(
              ([h, items]) => (
                <div key={h}>
                  <div
                    className="font-mono uppercase"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      color: "rgba(255,255,255,0.3)",
                    }}
                  >
                    {h}
                  </div>
                  <ul className="mt-4 space-y-3">
                    {items.map((item) => (
                      <li key={item.label}>
                        {"to" in item && item.to ? (
                          <Link
                            to={item.to}
                            style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}
                            className="transition-colors hover:text-white"
                          >
                            {item.label}
                          </Link>
                        ) : (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}
                            className="transition-colors hover:text-white"
                          >
                            {item.label}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ),
            )}
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
              © 2026 Veil · DeepBook Predict · Sui Overflow
            </span>
            <div className="flex gap-6">
              <Link
                to="/about"
                className="font-mono uppercase transition-colors hover:text-white"
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.25)",
                  letterSpacing: "0.1em",
                }}
              >
                About
              </Link>
              <Link
                to="/reach"
                className="font-mono uppercase transition-colors hover:text-white"
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.25)",
                  letterSpacing: "0.1em",
                }}
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
