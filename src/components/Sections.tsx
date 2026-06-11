type Section = {
  eyebrow: string;
  title: React.ReactNode;
  body: string;
};

const sections: Section[] = [
  {
    eyebrow: "The Problem",
    title: (
      <>
        Every order on a public ledger is <em className="italic text-[#6F6F6F]">visible</em> before it executes.
      </>
    ),
    body: "Front-running costs DeFi traders billions each year. On DeepBook without Veil, a $50,000 prediction order is broadcast to every market participant before it fills.",
  },
  {
    eyebrow: "The Solution",
    title: (
      <>
        Stealth execution, <em className="italic text-[#6F6F6F]">cryptographically</em> proven.
      </>
    ),
    body: "Veil runs your order inside a Nautilus TEE — your size and direction stay hidden until execution completes. Every decision is verified on-chain and archived on Walrus.",
  },
  {
    eyebrow: "How It Works",
    title: (
      <>
        Speak the trade. We <em className="italic text-[#6F6F6F]">execute the silence.</em>
      </>
    ),
    body: "Express any market view in plain English. Veil converts intent into an optimally-timed prediction position, slices it across volatility, and settles it privately on DeepBook Predict.",
  },
];

export function Sections() {
  return (
    <div className="relative z-10">
      {sections.map((s, i) => (
        <section
          key={s.eyebrow}
          id={`chapter-${i}`}
          className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-8 py-32"
          aria-labelledby={`section-${i}`}
        >
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 70%)",
            }}
          />
          <p className="mb-6 text-xs uppercase tracking-[0.4em] text-[#6F6F6F]">
            {s.eyebrow}
          </p>
          <h2
            id={`section-${i}`}
            className="max-w-4xl text-4xl text-white sm:text-6xl md:text-7xl"
            style={{
              fontFamily: '"Instrument Serif", serif',
              lineHeight: 1.0,
              letterSpacing: "-1.5px",
            }}
          >
            {s.title}
          </h2>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-[#9a9a9a] sm:text-lg">
            {s.body}
          </p>
        </section>
      ))}

      <section
        id="chapter-cta"
        className="relative mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-8 py-32 text-center"
      >
        <p className="mb-6 text-xs uppercase tracking-[0.4em] text-[#6F6F6F]">Begin</p>
        <h2
          className="text-5xl text-white sm:text-7xl"
          style={{ fontFamily: '"Instrument Serif", serif', lineHeight: 1.0, letterSpacing: "-1.5px" }}
        >
          Trade smarter. <em className="italic text-[#6F6F6F]">Stay invisible.</em>
        </h2>
        <button
          type="button"
          className="mt-12 rounded-full bg-white px-14 py-5 text-base text-black transition-transform duration-200 hover:scale-[1.03]"
        >
          Begin Journey
        </button>
      </section>
    </div>
  );
}
